using JPACS.Model;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace JPACS.Model
{
    public class SQLDBHelper : IDBHelper
    {
        private string _connectionString;

        public SQLDBHelper()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["JPACS_Connection"].ConnectionString;
        }

        public void AddOrUpdatePatient(ref Patient patient)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                SqlCommand com = new SqlCommand("JPACS_SP_AddOrUpdatePatient");
                com.Connection = conn;
                com.CommandType = System.Data.CommandType.StoredProcedure;

                SqlParameter parm = new SqlParameter("@nId", System.Data.SqlDbType.Int);
                parm.Direction = System.Data.ParameterDirection.Output;
                com.Parameters.Add(parm);

                com.Parameters.AddWithValue("@patientID", patient.PatientId);
                com.Parameters.AddWithValue("@patientName", patient.PatientName);
                com.Parameters.AddWithValue("@birthDate", patient.BirthDateString);
                com.Parameters.AddWithValue("@gender", patient.Gender);

                com.ExecuteNonQuery();

                patient.Id = (int)parm.Value;
            }
        }

        public void AddOrUpdateStudy(ref Study study)
        {
        }

        public void AddSeries(ref Series series)
        {
        }

        /// <summary>
        /// Will also add parent series and study if not exist
        /// </summary>
        /// <param name="image"></param>
        public void AddImage(ref Image image)
        {
            Study study = image.Series.Study;
            using (TransactionScope scope = new TransactionScope())
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    SqlCommand com = new SqlCommand("JPACS_SP_AddOrUpdateStudy");
                    com.Connection = conn;
                    com.CommandType = System.Data.CommandType.StoredProcedure;

                    SqlParameter parm = new SqlParameter("@nId", System.Data.SqlDbType.Int);
                    parm.Direction = System.Data.ParameterDirection.Output;
                    com.Parameters.Add(parm);

                    com.Parameters.AddWithValue("@studyUid", study.InstanceUid);
                    com.Parameters.AddWithValue("@patientId", study.Patient.Id);
                    com.Parameters.AddWithValue("@studyDate", study.StudyDateString);
                    com.Parameters.AddWithValue("@studyTime", study.StudyTimeString);
                    com.Parameters.AddWithValue("@acceptTime", study.StudyDateString);//TODO: get the correct accept time.

                    com.ExecuteNonQuery();

                    study.Id = (int)parm.Value;
                }

                Series series = image.Series;

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    SqlCommand com = new SqlCommand("JPACS_SP_AddOrUpdateSeries");
                    com.Connection = conn;
                    com.CommandType = System.Data.CommandType.StoredProcedure;

                    SqlParameter parm = new SqlParameter("@nId", System.Data.SqlDbType.Int);
                    parm.Direction = System.Data.ParameterDirection.Output;
                    com.Parameters.Add(parm);

                    com.Parameters.AddWithValue("@seriesUid", series.InstanceUid);
                    com.Parameters.AddWithValue("@studyId", study.Id);
                    com.Parameters.AddWithValue("@seriesNumber", series.SeriesNumber);
                    com.Parameters.AddWithValue("@seriesDate", series.SeriesDateString);
                    com.Parameters.AddWithValue("@seriesTime", series.SeriesTimeString);
                    com.Parameters.AddWithValue("@bodyPart", series.BodyPart);
                    com.Parameters.AddWithValue("@viewPosition", series.ViewPosition);
                    com.Parameters.AddWithValue("@modality", series.Modality);

                    com.ExecuteNonQuery();

                    series.Id = (int)parm.Value;
                }


                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    SqlCommand com = new SqlCommand("JPACS_SP_AddImage");
                    com.Connection = conn;
                    com.CommandType = System.Data.CommandType.StoredProcedure;

                    SqlParameter parm = new SqlParameter("@nId", System.Data.SqlDbType.Int);
                    parm.Direction = System.Data.ParameterDirection.Output;
                    com.Parameters.Add(parm);

                    com.Parameters.AddWithValue("@imageUid", image.SOPInstanceUid);
                    com.Parameters.AddWithValue("@seriesId", series.Id);
                    com.Parameters.AddWithValue("@imageNumber", image.ImageNumber);
                    com.Parameters.AddWithValue("@imageRows", image.ImageRows);
                    com.Parameters.AddWithValue("@imageColumns", image.ImageColumns);
                    com.Parameters.AddWithValue("@filePath", image.FilePath);

                    com.ExecuteNonQuery();

                    image.Id = (int)parm.Value;
                }

            scope.Complete();
        }
    }

        public void UpdateImageFilePath(Image img, string newPath)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                SqlCommand com = new SqlCommand("UPDATE [JPACS].[dbo].[Image] SET [ObjectFilePath] = @filePath WHERE Id = @id");
                com.Connection = conn;
                com.CommandType = System.Data.CommandType.Text;

                com.Parameters.AddWithValue("@id", img.Id);
                com.Parameters.AddWithValue("@filePath", newPath);

                com.ExecuteNonQuery();
            }
        }

        public List<Image> GetImages()
        {
            List<Image> images = new List<Image>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                StringBuilder sbSQL = new StringBuilder();
                sbSQL.Append("select Image.Id, Image.SOPInstanceUID, Image.ImageColumns, Image.ImageRows, Image.ObjectFilePath,");//4
                sbSQL.Append("Series.Id, Series.SeriesInstanceUID, Series.BodyPart, Series.ViewPosition, Series.Modality,");//9
                sbSQL.Append("Study.Id, Study.StudyInstanceUID, Study.StudyDate, Study.StudyTime, Study.AcceptTime,");//14
                sbSQL.Append("Patient.Id, Patient.PatientID, Patient.PatientName, Patient.BirthDate, Patient.Gender  from Image ");
                sbSQL.Append("join Series on Image.RefSeriesId = Series.Id ");
                sbSQL.Append("join Study on Series.RefStudyId = study.Id ");
                sbSQL.Append("join Patient on study.RefPatientId = Patient.Id");

                SqlCommand com = new SqlCommand(sbSQL.ToString());
                com.Connection = conn;
                com.CommandType = System.Data.CommandType.Text;

                using (SqlDataReader reader = com.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var id = reader.GetInt32(0);
                        var uid = reader.GetString(1);
                        Image newImage = new Image(uid)
                        {
                            Id = id,
                            ImageColumns = reader.GetInt32(2).ToString(),
                            ImageRows = reader.GetInt32(3).ToString(),
                            FilePath = reader.GetString(4)
                        };

                        id = reader.GetInt32(5);
                        uid = reader.GetString(6);
                        Series newSeries = new Series(uid)
                        {
                            Id = id,
                            BodyPart = reader.GetString(7),
                            ViewPosition = reader.GetString(8),
                            Modality = reader.GetString(9)
                        };

                        newImage.Series = newSeries;

                        id = reader.GetInt32(10);
                        uid = reader.GetString(11);
                        Study newStudy = new Study(uid)
                        {
                            Id = id,
                            StudyDateString = reader.GetString(12),
                            StudyTimeString = reader.GetString(13)
                        };
                        newSeries.Study = newStudy;
                        
                        id = reader.GetInt32(15);
                        uid = reader.GetString(16);
                        Patient newPatient = new Patient(uid)
                        {
                            Id = id,
                            PatientName = reader.GetString(17),
                            BirthDateString = reader.GetString(18),
                            Gender = reader.GetString(19)
                        };

                        newStudy.Patient = newPatient;

                        images.Add(newImage);
                    }
                }
            }

            return images;
        }
    }
}
