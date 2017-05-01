using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public class Series
    {
        public Series(string uid)
        {
            this.InstanceUid = uid;
        }

        public int Id { get; set; }

        public string InstanceUid { get; set; }

        public Study Study { get; set; }

        public string SeriesDateString {get;set;}

        public string SeriesTimeString { get; set; }

        public string BodyPart { get; set; }

        public string ViewPosition { get; set; }

        public string SeriesNumber { get; set; }

        public string Modality { get; set; }
    }
}
