using Dicom;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public static class Extensions
    {
        public static string GetTagString(this DicomDataset dataset, DicomTag tag, string defaultValue = "")
        {
            string value = defaultValue;

            if (dataset != null && dataset.Contains(tag))
            {
                value = dataset.Get<string>(tag);
            }

            return value;
        }

        public static DateTime GetTagDate(this DicomDataset dataset, DicomTag tag)
        {
            DateTime dtValue = DateTime.MinValue;

            if(dataset != null && dataset.Contains(tag))
            {
                string strDate = dataset.Get<string>(tag);

                if (!DateTime.TryParse(strDate, out dtValue))
                {
                    dtValue = DateTime.MinValue;
                }
            }

            return dtValue;
        }

        public static int GetTagInt(this DicomDataset dataset, DicomTag tag, int defaultValue = -1)
        {
            int intValue = defaultValue;

            if (dataset != null && dataset.Contains(tag))
            {
                string strValue = dataset.Get<string>(tag);

                if(!int.TryParse(strValue, out intValue))
                {
                    intValue = defaultValue;
                }
            }

            return intValue;
        }
    }
}
