using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public class Patient
    {
        private DateTime? _brithDate;

        public Patient(string patientId)
        {
            this.PatientId = patientId;
        }

        public int Id { get; set; }

        public string PatientId { get; set; }

        public string PatientName { get; set; }

        public string FirstName { get; set; }

        public string MiddleName { get; set; }

        public string LastName { get; set; }

        public string BirthDateString { get; set; }

        public DateTime? BirthDate
        {
            get
            {
                if(!_brithDate.HasValue && !string.IsNullOrEmpty(BirthDateString))
                {
                    DateTime dtTemp;

                    if(DateTime.TryParse(BirthDateString, out dtTemp))
                    {
                        _brithDate = dtTemp;
                    }
                }

                return _brithDate;
            }
        }

        public string Gender { get; set; }
        
    }
}
