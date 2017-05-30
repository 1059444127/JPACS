using Dicom.Network;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SSCUTest
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void btnSendDCM_Click(object sender, EventArgs e)
        {
            try
            {
                var client = new DicomClient();
                client.NegotiateAsyncOps();
                //for (int i = 0; i < 10; i++)
                //{
                //    client.AddRequest(new DicomCEchoRequest());
                //}

                //client.AddRequest(new DicomCStoreRequest(@"test1.dcm"));
                client.AddRequest(new DicomCStoreRequest(@"test1.dcm"));
                client.Send("127.0.0.1", 11123, false, "SCUTEST", "JPACSStoreSCP");
            }
            catch(Exception exp)
            {
                MessageBox.Show(exp.Message);
            }
        }
    }
}
