using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(WebPACS.Startup))]
namespace WebPACS
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
