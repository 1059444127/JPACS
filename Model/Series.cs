using Dicom;
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

        public static Series FromDataset(DicomDataset dataset)
        {
            var seriesUid = dataset.Get<string>(DicomTag.SeriesInstanceUID);
            Series series = new Series(seriesUid)
            {
                SeriesNumber = dataset.GetTagString(DicomTag.SeriesNumber),
                SeriesDateString = dataset.GetTagString(DicomTag.SeriesDate),
                SeriesTimeString = dataset.GetTagString(DicomTag.SeriesTime),
                BodyPart = dataset.GetTagString(DicomTag.BodyPartExamined),
                ViewPosition = dataset.GetTagString(DicomTag.ViewPosition),
                Modality = dataset.GetTagString(DicomTag.Modality)
            };

            return series;
        }
    }
}
