using Dicom;
using Dicom.Imaging;
using JPACS.Model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebPACS.Models;
using System.Web.Script.Serialization;
using System.IO.Compression;

namespace WebPACS.Controllers
{
    public class CompressAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var acceptEncoding = filterContext.HttpContext.Request.Headers["Accept-Encoding"];
            if (!string.IsNullOrEmpty(acceptEncoding))
            {
                acceptEncoding = acceptEncoding.ToLower();
                var response = filterContext.HttpContext.Response;
                if (acceptEncoding.Contains("gzip"))
                {
                    response.AppendHeader("Content-encoding", "gzip");
                    response.Filter = new GZipStream(response.Filter, CompressionMode.Compress);
                }
                else if (acceptEncoding.Contains("deflate"))
                {
                    response.AppendHeader("Content-encoding", "deflate");
                    response.Filter = new DeflateStream(response.Filter, CompressionMode.Compress);
                }
            }
        }
    }

    public class ImageController : Controller
    {
        private string timeLog()
        {
            DateTime dt = DateTime.Now;
            return string.Format("{0}:{1}:{2} {3}", dt.Hour, dt.Minute, dt.Second, dt.Millisecond);
        }

        public static object GetCache(string CacheKey)
        {
            System.Web.Caching.Cache objCache = HttpRuntime.Cache;
            
            return objCache[CacheKey];
        }
        public static void SetCache(string cacheKey, object objObject)
        {
            if (objObject == null)
                return;

            System.Web.Caching.Cache objCache = HttpRuntime.Cache;
            objCache.Insert(cacheKey, objObject);
        }

        // GET: Image
        public ActionResult Index()
        {
            List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();

            return View(images);
        }

        private void AddDicomTags(List<DicomTagModel> tags, DicomDataset ds)
        {
            //pass necessary dicom tags and value to client.
            List<DicomTag> tagsToAdd = new List<DicomTag>
            {
                DicomTag.PatientName, DicomTag.PatientID, DicomTag.PatientSex, DicomTag.PatientBirthDate, DicomTag.WindowWidth, DicomTag.WindowCenter, DicomTag.StudyTime,
                DicomTag.StudyDate, DicomTag.ViewPosition, DicomTag.BodyPartExamined
            };

            foreach (DicomTag t in tagsToAdd)
            {
                tags.Add(new DicomTagModel()
                {
                    group = t.Group,
                    element = t.Element,
                    value = ds.Contains(t) ? ds.Get<string>(t, "") : ""
                });
            }
        }

        private DicomImage GetDicomImage(int id)
        {
            DicomImage dcmImage = GetCache(id.ToString()) as DicomImage;
            if (dcmImage == null)
            {
                List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();
                Image image = images.First<Image>(i => i.Id == id);

                dcmImage = new DicomImage(image.FilePath);

                SetCache(id.ToString(), dcmImage);
            }

            return dcmImage;
        }

        public ActionResult Details(int id)
        {
            DicomImage dcmImage = GetDicomImage(id);

            ImageViewModel img = new ImageViewModel();
            img.WindowCenter = dcmImage.WindowCenter;
            img.WindowWidth = dcmImage.WindowWidth;
            img.ImageWidth = dcmImage.Width;
            img.ImageHeight = dcmImage.Height;
            img.Id = id;

            List<DicomTagModel> tags = new List<DicomTagModel>();
            AddDicomTags(tags, dcmImage.Dataset);

            var jsonSerialiser = new JavaScriptSerializer();
            string json = jsonSerialiser.Serialize(tags);
            img.DicomTags = json;

            DicomTag tgSerialize = new DicomTag(0x11, 0x11);
            string strJSON = dcmImage.Dataset.Contains(tgSerialize) ? dcmImage.Dataset.Get<string>(tgSerialize, "") : "";
            img.SerializeJSON = strJSON;

            return View(img);
        }

        [HttpGet]
        public FileContentResult GetDicomPixel(int id)
        {
            DicomImage dcmImage = GetDicomImage(id);

            var bytes = dcmImage.PixelData.GetFrame(0);

            return File(bytes.Data, "image");
        }

        [HttpGet]
        //[Compress] (compress can zip 39M to 5M, but the zip/unzip is more time consuming. if not zip, it takes 1.7s to load 39M, but with zip, it taks 5s to load 5 M)
        public FileContentResult GetImagePixel(int id, int windowWidth, int windowCenter)
        {
            DicomImage dcmImage = GetDicomImage(id);

            /* pass the pixel bytes is too huge: width*height*4
             * possible optimize: 
             * 1. use default gzip, but the zip/unzip is too slow, slower than the original one.
             * 2. only transfer width*height, and at client size, expand them to 4 plus.
             * */

            double originCenter = dcmImage.WindowCenter;
            double originWidth = dcmImage.WindowWidth;

            dcmImage.WindowWidth = windowWidth;
            dcmImage.WindowCenter = windowCenter;

            var intArray = dcmImage.RenderImage().Pixels.Data;

            byte[] result = new byte[intArray.Length * sizeof(int)];
            Buffer.BlockCopy(intArray, 0, result, 0, result.Length);

            dcmImage.WindowCenter = originCenter;
            dcmImage.WindowWidth = originWidth;

            return File(result, "image");
           
            /*send byte array pixel data, client side need to multiple each pixel to 4 bytes.
            double originCenter = dcmImage.WindowCenter;
            double originWidth = dcmImage.WindowWidth;

            dcmImage.WindowWidth = windowWidth;
            dcmImage.WindowCenter = windowCenter;

            var intArray = dcmImage.RenderImage().Pixels.Data;

            byte[] result = new byte[intArray.Length];

            int n;
            byte v;
            for(int i = 0; i< intArray.Length; i++)
            {
                n = intArray[i];
                v = (byte)(n >> 8);

                result[i] = v;
            }

            dcmImage.WindowCenter = originCenter;
            dcmImage.WindowWidth = originWidth;

            return File(result, "image");
            */
        }

        [HttpGet]
        public FileResult GetJPGImageData(int id, double windowWidth, double windowCenter)
        {
            try
            {
                
                DicomImage dcmImage = GetDicomImage(id);

                double originCenter = dcmImage.WindowCenter;
                double originWidth = dcmImage.WindowWidth;

                dcmImage.WindowWidth = windowWidth;
                dcmImage.WindowCenter = windowCenter;

                GC.Collect();

                Console.WriteLine(timeLog() + " start generate PNG image");

                MemoryStream stream = new MemoryStream();
                dcmImage.RenderImage().AsBitmap().Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                Console.WriteLine(timeLog() + " end generate PNG image");

                dcmImage.WindowCenter = originCenter;
                dcmImage.WindowWidth = originWidth;

                stream.Seek(0, SeekOrigin.Begin);
                return File(stream, "image/png");
            }
            catch (Exception e)
            {
                return null;
            }
        }

        [HttpPost]
        public ActionResult SaveDicomImage(int id, ImageViewModel model)
        {

            try
            {
                List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();
                Image image = images.First<Image>(i => i.Id == id);

                DicomImage dcmImage = GetDicomImage(id);
                dcmImage.WindowCenter = model.WindowCenter;
                dcmImage.WindowWidth = model.WindowWidth;

                DicomFile dcmFile = new DicomFile(dcmImage.Dataset);
                dcmFile.Dataset.AddOrUpdate<string>(DicomTag.WindowWidth, model.WindowWidth.ToString());
                dcmFile.Dataset.AddOrUpdate<string>(DicomTag.WindowCenter, model.WindowCenter.ToString());

                dcmFile.Dataset.AddOrUpdate<string>(new DicomTag(0x11, 0x11), model.SerializeJSON);

                DateTime dtNow = DateTime.Now;
                string newFile = string.Format("{0}-{1}-{2}-{3}-{4}-{5}.dcm", dtNow.Year, dtNow.Month, dtNow.Day, dtNow.Hour, dtNow.Minute, dtNow.Second);
                newFile = Path.Combine(Directory.GetParent(image.FilePath).FullName, newFile);
                dcmFile.Save(newFile);

                DBHelperFacotry.GetDBHelper().UpdateImageFilePath(image, newFile);
                
                return Json(new
                {
                    result = true
                });
            }
            catch (Exception e)
            {
                return Json(new
                {
                    result = false,
                    reason = e.Message
                });
            }
        }
    }
}