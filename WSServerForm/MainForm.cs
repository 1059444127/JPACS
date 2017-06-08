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
                    Console.WriteLine(timeLog() + " start load image data");

                    String strImg = GetImageData(1, 4098, 2046);
                    socket.Send(strImg);

                    Console.WriteLine(timeLog() + " finish load image data");
                };
            });
        }

        private string timeLog()
        {
            DateTime dt = DateTime.Now;
            return string.Format("{0}:{1}:{2} {3}", dt.Hour, dt.Minute, dt.Second, dt.Millisecond); 
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

        private string GetImageData(int imgId, int windowWidth, int windowCenter)
        {
            DicomImage dcmImage = GetDicomImage(imgId);

            int width = dcmImage.Width;
            int height = dcmImage.Height;

            double originCenter = dcmImage.WindowCenter;
            double originWidth = dcmImage.WindowWidth;

            dcmImage.WindowWidth = windowWidth;
            dcmImage.WindowCenter = windowCenter;

            GC.Collect();

            string strResult = string.Empty;

            using (System.IO.MemoryStream stream = new System.IO.MemoryStream())
            {
                Console.WriteLine(timeLog() + " start generate PNG image");
                dcmImage.RenderImage().AsBitmap().Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                Console.WriteLine(timeLog() + " finish generate PNG image");
                Console.WriteLine(timeLog() + " start base64 string");
                strResult = "data:image/png;base64," + Convert.ToBase64String(stream.GetBuffer());
                Console.WriteLine(timeLog() + " finish base64 string");
            }

            dcmImage.WindowCenter = originCenter;
            dcmImage.WindowWidth = originWidth;

            return strResult;
        }
    }
}
