namespace SSCUTest
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.btnSendDCM = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // btnSendDCM
            // 
            this.btnSendDCM.Location = new System.Drawing.Point(120, 191);
            this.btnSendDCM.Name = "btnSendDCM";
            this.btnSendDCM.Size = new System.Drawing.Size(130, 44);
            this.btnSendDCM.TabIndex = 0;
            this.btnSendDCM.Text = "Send DCM file";
            this.btnSendDCM.UseVisualStyleBackColor = true;
            this.btnSendDCM.Click += new System.EventHandler(this.btnSendDCM_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(526, 383);
            this.Controls.Add(this.btnSendDCM);
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button btnSendDCM;
    }
}

