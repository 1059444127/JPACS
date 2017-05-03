using Dicom;
using Dicom.Log;
using Dicom.Network;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using JPACS.Model;

namespace JPACS.SSCPForm
{
    internal class CStoreSCP : DicomService, IDicomServiceProvider, IDicomCStoreProvider, IDicomCEchoProvider
    {
        private static DicomTransferSyntax[] AcceptedTransferSyntaxes = new DicomTransferSyntax[]
                                                                            {
                                                                                DicomTransferSyntax.ExplicitVRLittleEndian,
                                                                                DicomTransferSyntax.ExplicitVRBigEndian,
                                                                                DicomTransferSyntax.ImplicitVRLittleEndian
                                                                            };

        private static DicomTransferSyntax[] AcceptedImageTransferSyntaxes = new DicomTransferSyntax[]
                                                                                 {
                                                                                    // Lossless
                                                                                    DicomTransferSyntax.JPEGLSLossless,
                                                                                    DicomTransferSyntax.JPEG2000Lossless,
                                                                                    DicomTransferSyntax.JPEGProcess14SV1,
                                                                                    DicomTransferSyntax.JPEGProcess14,
                                                                                    DicomTransferSyntax.RLELossless,
                                                                                    // Lossy
                                                                                    DicomTransferSyntax.JPEGLSNearLossless,
                                                                                    DicomTransferSyntax.JPEG2000Lossy,
                                                                                    DicomTransferSyntax.JPEGProcess1,
                                                                                    DicomTransferSyntax.JPEGProcess2_4,
                                                                                    // Uncompressed
                                                                                    DicomTransferSyntax.ExplicitVRLittleEndian,
                                                                                    DicomTransferSyntax.ExplicitVRBigEndian,
                                                                                    DicomTransferSyntax.ImplicitVRLittleEndian
                                                                                 };

        public CStoreSCP(INetworkStream stream, Encoding fallbackEncoding, Logger log)
            : base(stream, fallbackEncoding, log)
        {
        }

        public void OnReceiveAssociationRequest(DicomAssociation association)
        {
            if (string.Compare(association.CalledAE, SSCPConfig.Instance.AEName, true) != 0)
            {
                SendAssociationReject(
                    DicomRejectResult.Permanent,
                    DicomRejectSource.ServiceUser,
                    DicomRejectReason.CalledAENotRecognized);
                return;
            }

            foreach (var pc in association.PresentationContexts)
            {
                if (pc.AbstractSyntax == DicomUID.Verification)
                    pc.AcceptTransferSyntaxes(AcceptedTransferSyntaxes);

                else if (pc.AbstractSyntax.StorageCategory != DicomStorageCategory.None)
                    pc.AcceptTransferSyntaxes(AcceptedImageTransferSyntaxes);
            }

            SendAssociationAccept(association);
        }

        public void OnReceiveAssociationReleaseRequest()
        {
            SendAssociationReleaseResponse();
        }

        public void OnReceiveAbort(DicomAbortSource source, DicomAbortReason reason)
        {
        }

        public void OnConnectionClosed(Exception exception)
        {
        }

        public DicomCStoreResponse OnCStoreRequest(DicomCStoreRequest request)
        {
            //need to check:
            //1. multi request, multi thread?
            //2. how about if failed?

            try
            {
                var patientId = request.Dataset.Get<string>(DicomTag.PatientID);
                if (string.IsNullOrEmpty(patientId))
                    throw new Exception("invalid patient id");

                var studyUid = request.Dataset.Get<string>(DicomTag.StudyInstanceUID);
                var imageUid = request.SOPInstanceUID.UID;

                string folder = Path.Combine(SSCPConfig.Instance.StoragePath, string.Format("{0}{1:D2}{2:d2}", DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day), patientId);
                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                string file = Path.Combine(folder, imageUid) + ".dcm";
                request.File.Save(file);

                //Dicom.Imaging.DicomImage dcmImage = new Dicom.Imaging.DicomImage(file);

                SaveToDatabase(request.Dataset, file);

                return new DicomCStoreResponse(request, DicomStatus.Success);
            }
            catch(ImageExitException exitExp)
            {
                Logger.Error(exitExp.Message);
                return new DicomCStoreResponse(request, DicomStatus.DuplicateSOPInstance);
            }
            catch (Exception e)
            {
                Logger.Error(e.Message);
                return new DicomCStoreResponse(request, DicomStatus.ProcessingFailure);
            }
        }

        public void OnCStoreRequestException(string tempFileName, Exception e)
        {
            // let library handle logging and error response
        }

        public DicomCEchoResponse OnCEchoRequest(DicomCEchoRequest request)
        {
            return new DicomCEchoResponse(request, DicomStatus.Success);
        }

        private void SaveToDatabase(DicomDataset dataset, string filePath)
        {
            Patient patient = Patient.FromDataset(dataset);

            IDBHelper dbHelper = DBHelperFacotry.GetDBHelper();
            dbHelper.AddOrUpdatePatient(ref patient);

            Study study = Study.FromDataset(dataset);
            study.Patient = patient;

            Series series = Series.FromDataset(dataset);
            series.Study = study;

            Image image = Image.FromDataset(dataset);
            image.FilePath = filePath;
            image.Series = series;

            //add to database
            dbHelper.AddImage(ref image);
        }
    }
}
