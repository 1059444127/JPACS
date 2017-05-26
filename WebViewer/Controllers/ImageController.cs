using Dicom;
using Dicom.Imaging;
using JPACS.Model;
using System;
using System.Collections.Generic;
using System.IO;
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

            string imageUrl = "~/Images/" + image.SOPInstanceUid + ".jpg";
            string physicalPath = Server.MapPath(imageUrl);

            //generate image file
            DicomImage dcmImage = new DicomImage(image.FilePath);
            double wc = dcmImage.WindowCenter;
            double ww = dcmImage.WindowWidth;

            //if(!System.IO.File.Exists(physicalPath))
            {
                if (!Directory.Exists(Directory.GetParent(physicalPath).FullName))
                    Directory.CreateDirectory(Directory.GetParent(physicalPath).FullName);

                dcmImage.RenderImage().AsBitmap().Save(physicalPath);
            }

            ViewBag.ImageUrl = UrlHelper.GenerateContentUrl(imageUrl, ControllerContext.HttpContext);

            return View(image);
        }
    }
}