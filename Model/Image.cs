using Dicom;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public class Image
    {
        public Image(string sopUid)
        {
            this.SOPInstanceUid = sopUid;
        }

        public int Id { get; set; }

        public string SOPInstanceUid { get; set; }

        public string ImageNumber { get; set; }

        public string ImageDateString { get; set; }

        public string ImageTimeString { get; set; }

        public string ImageRows { get; set; }

        public string ImageColumns { get; set; }

        public string FilePath { get; set; }

        public Series Series { get; set; }

        public static Image FromDataset(DicomDataset dataset)
        {
            var SOPInstanceUid = dataset.GetTagString(DicomTag.SOPInstanceUID);
            Image image = new Image(SOPInstanceUid)
            {
                ImageRows = dataset.GetTagString(DicomTag.Rows),
                ImageColumns = dataset.GetTagString(DicomTag.Columns),
                ImageNumber = string.Empty
            };

            return image;
        }
    }
}
