using Dicom.Imaging;
using Fleck;
using JPACS.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WSServerForm
{
    public partial class MainForm : Form
    {
        private WebSocketServer _wsServer;
        private List<IWebSocketConnection> _clientSockets;

        private Dictionary<string, object> _objCache;

        public MainForm()
        {
            InitializeComponent();
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            _objCache = new Dictionary<string, object>();

              _wsServer = new WebSocketServer("ws://0.0.0.0:8181");
            _clientSockets = new List<IWebSocketConnection>();

            _wsServer.RestartAfterListenError = true;
            _wsServer.SupportedSubProtocols = new[] { "superchat", "chat" };
            _wsServer.ListenerSocket.NoDelay = true;

            _wsServer.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    Console.WriteLine("Open!");
                    _clientSockets.Add(socket);
                };
                socket.OnClose = () =>
                {
                    Console.WriteLine("Close!");
                    _clientSockets.Remove(socket);
                };
                socket.OnMessage = message =>
                {
                    Console.WriteLine(DateTime.Now.ToLongTimeString() + " start load image data");

                    byte[] imgData = GetImageData(1, 4098, 2046);
                    String strImg = "data:image/png;base64," + Convert.ToBase64String(imgData);

                    //_clientSockets.ToList().ForEach(s => s.Send(strImg));
                    socket.Send(strImg);

                    Console.WriteLine(DateTime.Now.ToLongTimeString() + " finish load image data");
                };
            });
        }

        public object GetCache(string CacheKey)
        {
            if (!_objCache.ContainsKey(CacheKey))
                return null;

            return _objCache[CacheKey];
        }
        public void SetCache(string cacheKey, object objObject)
        {
            if (objObject == null)
                return;

            _objCache[cacheKey] = objObject;
        }

        private DicomImage GetDicomImage(int id)
        {
            DicomImage dcmImage = GetCache(id.ToString()) as DicomImage;
            if (dcmImage == null)
            {
                List<JPACS.Model.Image> images = DBHelperFacotry.GetDBHelper().GetImages();
                var image = images.First<JPACS.Model.Image>(i => i.Id == id);

                dcmImage = new DicomImage(image.FilePath);

                SetCache(id.ToString(), dcmImage);
            }

            return dcmImage;
        }

        private byte[] GetImageData(int imgId, int windowWidth, int windowCenter)
        {
            DicomImage dcmImage = GetDicomImage(imgId);

            int width = dcmImage.Width;
            int height = dcmImage.Height;

            double originCenter = dcmImage.WindowCenter;
            double originWidth = dcmImage.WindowWidth;

            dcmImage.WindowWidth = windowWidth;
            dcmImage.WindowCenter = windowCenter;

            GC.Collect();

            
             //method 2, send buffer,and conver to base64 string
            byte[] result;
            using (System.IO.MemoryStream stream = new System.IO.MemoryStream())
            {
                /*method 1, send bmp
                dcmImage.RenderImage().AsBitmap().Save(stream, System.Drawing.Imaging.ImageFormat.Bmp);
                */
                dcmImage.RenderImage().AsBitmap().Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                result = stream.GetBuffer();
            }

            dcmImage.WindowCenter = originCenter;
            dcmImage.WindowWidth = originWidth;

            /*method 1 send img
            int iRealLen = result.Length - 54;
            byte[] image = new byte[iRealLen];
            int iIndex = 0;
            int iRowIndex = 0;
            int iWidth = width * 4;
            for (int i = height - 1; i >= 0; --i)
            {
                iRowIndex = i * iWidth;
                for (int j = 0; j < iWidth; j += 4)
                {
                    // RGB to BGR
                    image[iIndex++] = result[iRowIndex + j + 2 + 54]; // B
                    image[iIndex++] = result[iRowIndex + j + 1 + 54]; // G
                    image[iIndex++] = result[iRowIndex + j + 54];     // R
                    image[iIndex++] = result[iRowIndex + j + 3 + 54]; // A
                }
            }

            return image;
            */

            return result;
        }
    }
}
