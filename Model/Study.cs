using Dicom;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public class Study
    {
        public Study(string uid)
        {
            this.InstanceUid = uid;
        }

        public int Id { get; set; }

        public string InstanceUid { get; set; }

        public Patient Patient { get; set; }

        public string StudyDateString { get; set; }

        public string StudyTimeString { get; set; }

        //public DateTime StudyDate { get; }

        //public DateTime StudyTime { get; }

        //public DateTime AcceptTime { get; }

        public static Study FromDataset(DicomDataset dataset)
        {
            var studyUid = dataset.GetTagString(DicomTag.StudyInstanceUID);

            if (string.IsNullOrEmpty(studyUid))
                return null;

            Study study = new Study(studyUid)
            {
                StudyDateString = dataset.GetTagString(DicomTag.StudyDate),
                StudyTimeString = dataset.GetTagString(DicomTag.StudyTime)            
            };

            return study;
        }
    }
}
