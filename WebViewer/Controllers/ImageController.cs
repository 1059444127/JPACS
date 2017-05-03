using Dicom;
using Dicom.Imaging;
using JPACS.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebPACS.Controllers
{
    public class ImageController : Controller
    {
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

            //generate image file
            DicomImage dcmImage = new DicomImage(image.FilePath);

            string imageUrl = "~/Images/" + image.SOPInstanceUid + ".jpg";
            string physicalPath = Server.MapPath(imageUrl);

            dcmImage.RenderImage().AsBitmap().Save(physicalPath);

            ViewBag.ImageUrl = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext);

            return View(image);
        }
    }
}