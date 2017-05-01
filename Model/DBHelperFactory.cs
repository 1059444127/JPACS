using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public class DBHelperFacotry
    {
        private static IDBHelper _dbHelper;

        private DBHelperFacotry()
        {
        }

        public static IDBHelper GetDBHelper()
        {
            try
            {
                if (_dbHelper == null)
                {
                    string strAssemblyName = ConfigurationManager.AppSettings.Get("DBHelperAssembly");
                    string strClassName = ConfigurationManager.AppSettings.Get("DBHelper");

                    _dbHelper = Assembly.Load(strAssemblyName).CreateInstance(strClassName) as IDBHelper;
                }

                return _dbHelper;
            }
            catch (Exception)
            {
                throw;
            }
        }

    }
}
