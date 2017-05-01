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

        public DateTime StudyDate { get; }

        public DateTime StudyTime { get; }

        public DateTime AcceptTime { get; }

    }
}
