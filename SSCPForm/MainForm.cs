using Dicom.Log;
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

namespace JPACS.SSCPForm
{
    public partial class MainForm : Form
    {
        public MainForm()
        {
            InitializeComponent();
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            //LogManager.SetImplementation(NLogManager.Instance);

            var server = DicomServer.Create<CStoreSCP>(SSCPConfig.Instance.Port);
        }
    }
}
