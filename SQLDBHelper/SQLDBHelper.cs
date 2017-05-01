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
            int nId = -1;

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
    }
}
