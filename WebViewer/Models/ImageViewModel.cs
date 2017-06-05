using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebPACS.Models
{
    public class DicomTagModel
    {
        public int group { get; set; }
        public int element { get; set; }
        public string value { get; set; }
    }

    public class ImageViewModel
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public double WindowCenter { get; set; }
        public double WindowWidth { get; set; }
        public int ImageWidth { get; set; }
        public int ImageHeight { get; set;}

        public string DicomTags { get; set; }

        public string SerializeJSON { get; set; }
    }
}