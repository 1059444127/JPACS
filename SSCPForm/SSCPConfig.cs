using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.SSCPForm
{
    internal class SSCPConfig
    {
        internal static readonly SSCPConfig Instance = new SSCPConfig();

        private string _storagePath;
        private int _port = 11123;
        private string _strAEName = "JPACSStoreSCP";

        private SSCPConfig()
        {
        }

        internal string StoragePath
        {
            get
            {
                if (string.IsNullOrEmpty(_storagePath))
                {
                    _storagePath = @"C:\JPACSStorage";

                    if (!System.IO.Directory.Exists(_storagePath))
                    {
                        System.IO.Directory.CreateDirectory(_storagePath);
                    }
                }

                return _storagePath;
            }
            set
            {
                _storagePath = value;
            }
        }

        internal int Port
        {
            get
            {
                return _port;
            }
            set
            {
                _port = value;
            }
        }

        internal string AEName
        {
            get
            {
                return _strAEName;
            }
            set
            {
                _strAEName = value;
            }
        }

    }
}
