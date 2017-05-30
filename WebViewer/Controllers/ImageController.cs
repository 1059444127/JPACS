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

namespace WebPACS.Controllers
{
    public class ImageController : Controller
    {
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

        private void AddOverlayTags(List<DicomTagModel> tags, DicomDataset ds)
        {
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

        public ActionResult Details(int id)
        {
            List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();
            Image image = images.First<Image>(i => i.Id == id);

            string imageUrl = "~/Images/" + image.SOPInstanceUid + ".jpg";
            string physicalPath = Server.MapPath(imageUrl);

            //generate image file

            DicomImage dcmImage;
            dcmImage = GetCache(image.SOPInstanceUid) as DicomImage;
            if(dcmImage == null)
            {
                dcmImage = new DicomImage(image.FilePath);
                SetCache(image.SOPInstanceUid, dcmImage);
            }

            var bytes = dcmImage.PixelData.GetFrame(0);


            if(!System.IO.File.Exists(physicalPath))
            {
                if (!Directory.Exists(Directory.GetParent(physicalPath).FullName))
                    Directory.CreateDirectory(Directory.GetParent(physicalPath).FullName);

                dcmImage.RenderImage().AsBitmap().Save(physicalPath);
            }

            ImageViewModel img = new ImageViewModel();
            img.ImageUrl = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext);
            img.WindowCenter = dcmImage.WindowCenter;
            img.WindowWidth = dcmImage.WindowWidth;
            img.ImageWidth = dcmImage.Width;
            img.ImageHeight = dcmImage.Height;

            List<DicomTagModel> tags = new List<DicomTagModel>();
            AddOverlayTags(tags, dcmImage.Dataset);

            var jsonSerialiser = new JavaScriptSerializer();
            string json = jsonSerialiser.Serialize(tags);
            img.DicomTags = json;

            //ViewBag.ImageInfo = Json(img).ToString();// = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext);

            return View(img);
        }

        [HttpGet]
        public FileContentResult GetPixelData(int id)
        {
            List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();
            Image image = images.First<Image>(i => i.Id == id);

            DicomImage dcmImage;
            dcmImage = GetCache(image.SOPInstanceUid) as DicomImage;
            if (dcmImage == null)
            {
                dcmImage = new DicomImage(image.FilePath);
                SetCache(image.SOPInstanceUid, dcmImage);
            }

            var bytes = dcmImage.PixelData.GetFrame(0);

            return File(bytes.Data, "image");
        }

        [HttpPost]
        public ActionResult AdjustWL(ImageViewModel model)
        {
            try
            {
                List<Image> images = DBHelperFacotry.GetDBHelper().GetImages();
                Image image = images.First<Image>();

                DicomImage dcmImage;
                dcmImage = GetCache(image.SOPInstanceUid) as DicomImage;
                if (dcmImage == null)
                {
                    dcmImage = new DicomImage(image.FilePath);
                    SetCache(image.SOPInstanceUid, dcmImage);
                }

                double originCenter = dcmImage.WindowCenter;
                double originWidth = dcmImage.WindowWidth;

                string imageUrl = string.Format("~/Images/{0}_{1}_{2}.jpg", image.SOPInstanceUid, model.WindowCenter, model.WindowWidth);
                string physicalPath = Server.MapPath(imageUrl);

                if (!System.IO.File.Exists(physicalPath))
                {
                    dcmImage.WindowCenter = model.WindowCenter;
                    dcmImage.WindowWidth = model.WindowWidth;
                    dcmImage.RenderImage().AsBitmap().Save(physicalPath);
                }

                dcmImage.WindowCenter = originCenter;
                dcmImage.WindowWidth = originWidth;

                return Json(new
                {
                    imgSrc = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext)
                });
            }
            catch (Exception e)
            {
                return Json(new
                {
                    imgSrc = "failed due to " + e.Message
                });
            }
        }
    }
}