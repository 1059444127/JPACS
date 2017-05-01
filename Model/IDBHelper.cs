using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JPACS.Model
{
    public interface IDBHelper
    {
        #region Patient

        void AddOrUpdatePatient(ref Patient patient);

        #endregion

        #region Study

        void AddOrUpdateStudy(ref Study study);

        #endregion

        #region Series

        void AddSeries(ref Series series);

        #endregion

        #region Image

        void AddImage(ref Image image);

        #endregion
    }
}
