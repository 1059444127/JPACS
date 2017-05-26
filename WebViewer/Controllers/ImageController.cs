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

            //ViewBag.ImageInfo = Json(img).ToString();// = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext);

            return View(img);
        }

        [HttpPost]
        public ActionResult AdjustWL(ImageViewModel obj)
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

            dcmImage.WindowCenter = obj.WindowCenter;
            dcmImage.WindowWidth = obj.WindowWidth;

            string imageUrl = string.Format("~/Images/{0}_{1}_{2}.jpg", image.SOPInstanceUid, dcmImage.WindowCenter, dcmImage.WindowWidth);
            string physicalPath = Server.MapPath(imageUrl);

            if (!System.IO.File.Exists(physicalPath))
            {
                dcmImage.RenderImage().AsBitmap().Save(physicalPath);
            }

            return Json(new
            {
                imgSrc = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext)
            });
        }
    }
}