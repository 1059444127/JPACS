USE [master]
GO
/****** Object:  Database [JPACS]    Script Date: 04/30/2017 13:21:50 ******/
CREATE DATABASE [JPACS] ON  PRIMARY 
( NAME = N'JPACS', FILENAME = N'D:\Database\JPACS.mdf' , SIZE = 2048KB , MAXSIZE = UNLIMITED, FILEGROWTH = 1024KB )
 LOG ON 
( NAME = N'JPACS_log', FILENAME = N'D:\Database\JPACS_log.ldf' , SIZE = 1024KB , MAXSIZE = 2048GB , FILEGROWTH = 10%)
GO
ALTER DATABASE [JPACS] SET COMPATIBILITY_LEVEL = 100
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [JPACS].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [JPACS] SET ANSI_NULL_DEFAULT OFF
GO
ALTER DATABASE [JPACS] SET ANSI_NULLS OFF
GO
ALTER DATABASE [JPACS] SET ANSI_PADDING OFF
GO
ALTER DATABASE [JPACS] SET ANSI_WARNINGS OFF
GO
ALTER DATABASE [JPACS] SET ARITHABORT OFF
GO
ALTER DATABASE [JPACS] SET AUTO_CLOSE OFF
GO
ALTER DATABASE [JPACS] SET AUTO_CREATE_STATISTICS ON
GO
ALTER DATABASE [JPACS] SET AUTO_SHRINK OFF
GO
ALTER DATABASE [JPACS] SET AUTO_UPDATE_STATISTICS ON
GO
ALTER DATABASE [JPACS] SET CURSOR_CLOSE_ON_COMMIT OFF
GO
ALTER DATABASE [JPACS] SET CURSOR_DEFAULT  GLOBAL
GO
ALTER DATABASE [JPACS] SET CONCAT_NULL_YIELDS_NULL OFF
GO
ALTER DATABASE [JPACS] SET NUMERIC_ROUNDABORT OFF
GO
ALTER DATABASE [JPACS] SET QUOTED_IDENTIFIER OFF
GO
ALTER DATABASE [JPACS] SET RECURSIVE_TRIGGERS OFF
GO
ALTER DATABASE [JPACS] SET  DISABLE_BROKER
GO
ALTER DATABASE [JPACS] SET AUTO_UPDATE_STATISTICS_ASYNC OFF
GO
ALTER DATABASE [JPACS] SET DATE_CORRELATION_OPTIMIZATION OFF
GO
ALTER DATABASE [JPACS] SET TRUSTWORTHY OFF
GO
ALTER DATABASE [JPACS] SET ALLOW_SNAPSHOT_ISOLATION OFF
GO
ALTER DATABASE [JPACS] SET PARAMETERIZATION SIMPLE
GO
ALTER DATABASE [JPACS] SET READ_COMMITTED_SNAPSHOT OFF
GO
ALTER DATABASE [JPACS] SET HONOR_BROKER_PRIORITY OFF
GO
ALTER DATABASE [JPACS] SET  READ_WRITE
GO
ALTER DATABASE [JPACS] SET RECOVERY FULL
GO
ALTER DATABASE [JPACS] SET  MULTI_USER
GO
ALTER DATABASE [JPACS] SET PAGE_VERIFY CHECKSUM
GO
ALTER DATABASE [JPACS] SET DB_CHAINING OFF
GO
USE [JPACS]
GO
/****** Object:  Table [dbo].[Patient]    Script Date: 04/30/2017 13:21:51 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Patient](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[PatientID] [varchar](50) NOT NULL,
	[FistName] [varchar](64) NULL,
	[MiddleName] [varchar](64) NULL,
	[LastName] [varchar](64) NULL,
	[PatientName] [varchar](200) NULL,
	[BirthDate] varchar(12) NULL,
	[Gender] [varchar](16) NULL,
 CONSTRAINT [PK_Patient_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
CREATE NONCLUSTERED INDEX [IX_Patient_Name] ON [dbo].[Patient] 
(
	[PatientName] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Study]    Script Date: 04/30/2017 13:21:51 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Study](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[StudyInstanceUID] [varchar](65) NOT NULL,
	[RefPatientId] [int] NOT NULL,
	[StudyDate] varchar(12) NULL,
	[StudyTime] varchar(12) NULL,
	[AcceptTime] [varchar](24) NULL,
 CONSTRAINT [PK_Study_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
CREATE NONCLUSTERED INDEX [IX_Study_UID] ON [dbo].[Study] 
(
	[StudyInstanceUID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Series]    Script Date: 04/30/2017 13:21:51 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Series](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SeriesInstanceUID] [varchar](65) NOT NULL,
	[RefStudyId] [int] NOT NULL,
	[SeriesNumber] [int] NULL,
	[SeriesDate] varchar(12) NULL,
	[SeriesTime] varchar(12) NULL,
	[BodyPart] [varchar](32) NULL,
	[ViewPosition] [varchar](32) NULL,
	[Modality] [varchar](16) NULL,
 CONSTRAINT [PK_Series_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
CREATE NONCLUSTERED INDEX [IX_Series_UID] ON [dbo].[Series] 
(
	[SeriesInstanceUID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Image]    Script Date: 04/30/2017 13:21:51 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Image](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SOPInstanceUID] [varchar](65) NOT NULL,
	[RefSeriesId] [int] NOT NULL,
	[ImageNumber] [varchar](12) NULL,
	[ImageDate] varchar(12) NULL,
	[ImageTime] varchar(12) NULL,
	[FrameCount] [int] NULL,
	[SamplesPerPixel] [int] NULL,
	[ImageRows] [int] NULL,
	[ImageColumns] [int] NULL,
	[ObjectFilePath] [varchar](256) NULL,
 CONSTRAINT [PK_Image_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
CREATE NONCLUSTERED INDEX [IX_Image_UID] ON [dbo].[Image] 
(
	[SOPInstanceUID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
GO
/****** Object:  ForeignKey [FK_Study_Patient]    Script Date: 04/30/2017 13:21:51 ******/
ALTER TABLE [dbo].[Study]  WITH CHECK ADD  CONSTRAINT [FK_Study_Patient] FOREIGN KEY([RefPatientId])
REFERENCES [dbo].[Patient] ([Id])
GO
ALTER TABLE [dbo].[Study] CHECK CONSTRAINT [FK_Study_Patient]
GO
/****** Object:  ForeignKey [FK_Series_Study]    Script Date: 04/30/2017 13:21:51 ******/
ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [FK_Series_Study] FOREIGN KEY([RefStudyId])
REFERENCES [dbo].[Study] ([Id])
GO
ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [FK_Series_Study]
GO
/****** Object:  ForeignKey [FK_Image_Series]    Script Date: 04/30/2017 13:21:51 ******/
ALTER TABLE [dbo].[Image]  WITH CHECK ADD  CONSTRAINT [FK_Image_Series] FOREIGN KEY([RefSeriesId])
REFERENCES [dbo].[Series] ([Id])
GO
ALTER TABLE [dbo].[Image] CHECK CONSTRAINT [FK_Image_Series]
GO


USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdatePatient]    Script Date: 05/01/2017 22:17:42 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JPACS_SP_AddOrUpdatePatient]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[JPACS_SP_AddOrUpdatePatient]
GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdatePatient]    Script Date: 05/01/2017 22:17:42 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[JPACS_SP_AddOrUpdatePatient]
	@nId			int output,
	@patientID		varchar(50),
	@patientName	varchar(200),
	@birthDate		varchar(12),
	@gender			varchar(16)
AS
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
BEGIN
	BEGIN TRANSACTION
	
	select @nId = -1
	
	select @nId = Patient.Id from Patient where PatientID = @patientID and PatientName = @patientName
	
	if @nId > 0 -- exist, do update
		begin
			update Patient set BirthDate = @birthDate, Gender = @gender  where Patient.Id = @nId
		end
	else -- not exist, insert new one
		begin
			insert into Patient (PatientID, PatientName, BirthDate, Gender) values (@patientID, @patientName, @birthDate, @gender)
			
			select @nId = @@IDENTITY
		end
	
	IF @@ERROR<>0 
		BEGIN
			ROLLBACK TRANSACTION
			RETURN -1
		END
	
	COMMIT TRANSACTION
	
	RETURN 1
END


GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdateStudy]    Script Date: 05/01/2017 22:31:07 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JPACS_SP_AddOrUpdateStudy]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[JPACS_SP_AddOrUpdateStudy]
GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdateStudy]    Script Date: 05/01/2017 22:31:07 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[JPACS_SP_AddOrUpdateStudy]
	@nId			int output,
	@studyUid		varchar(65),
	@patientId		int,
	@studyDate		varchar(12),
	@studyTime		varchar(12),
	@acceptTime		varchar(12)
AS
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
BEGIN

	select @nId = -1
	
	select @nId = Study.Id from Study where StudyInstanceUID = @studyUid
	
	if @nId > 0 -- exist, do update
		begin
			update Study set StudyDate = @studyDate, StudyTime = @studyTime, AcceptTime = @acceptTime where Study.Id=@nId
		end
	else -- not exist, insert new one
		begin
			insert into Study (StudyInstanceUID, RefPatientId, StudyDate, StudyTime, AcceptTime) values (@studyUid, @patientID, @studyDate, @studyTime, @acceptTime)
			
			select @nId = @@IDENTITY
		end
	
	IF @@ERROR<>0 
		BEGIN
			RETURN -1
		END
	
	RETURN 1
END



GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdateSeries]    Script Date: 05/01/2017 22:44:46 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JPACS_SP_AddOrUpdateSeries]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[JPACS_SP_AddOrUpdateSeries]
GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddOrUpdateSeries]    Script Date: 05/01/2017 22:44:46 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [dbo].[JPACS_SP_AddOrUpdateSeries]
	@nId			int output,
	@seriesUid		varchar(65),
	@studyId		int,
	@seriesNumber	int,
	@seriesDate		varchar(12),
	@seriesTime		varchar(12),
	@bodyPart		varchar(32),
	@viewPosition	varchar(32),
	@modality		varchar(16)
AS
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
BEGIN

	select @nId = -1
	
	select @nId = Series.Id from Series where SeriesInstanceUID = @seriesUid
	
	if @nId > 0 -- exist, do update
		begin
			update Series set SeriesNumber = @seriesNumber, SeriesDate = @seriesDate, SeriesTime = @seriesTime, BodyPart = @bodyPart, ViewPosition = @viewPosition, Modality = @modality where Series.Id=@nId
		end
	else -- not exist, insert new one
		begin
			insert into Series (SeriesInstanceUID, RefStudyId, SeriesNumber, SeriesDate, SeriesTime, BodyPart, ViewPosition, Modality) values (@seriesUid, @studyId, @seriesNumber, @seriesDate, @seriesTime, @bodyPart, @viewPosition, @modality)
			
			select @nId = @@IDENTITY
		end
	
	IF @@ERROR<>0 
		BEGIN
			RETURN -1
		END
	
	RETURN 1
END


GO


USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddImage]    Script Date: 05/01/2017 22:52:49 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JPACS_SP_AddImage]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[JPACS_SP_AddImage]
GO

USE [JPACS]
GO

/****** Object:  StoredProcedure [dbo].[JPACS_SP_AddImage]    Script Date: 05/01/2017 22:52:49 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[JPACS_SP_AddImage]
	@nId			int output,
	@imageUid		varchar(65),
	@seriesId		int,
	@imageNumber	int,
	@imageRows		int,
	@imageColumns	int,
	@filePath		varchar(256)
AS
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
BEGIN

	select @nId = -1
	
	if NOT EXISTS (select 1 from Image where SOPInstanceUID = @imageUid)
	begin
	
		insert into Image (SOPInstanceUID, RefSeriesId, ImageNumber, ImageRows, ImageColumns, ObjectFilePath) values (@imageUid, @seriesId, @imageNumber, @imageRows, @imageColumns, @filePath)
		select @nId = @@IDENTITY
		
		return 1
	end
	else
		return -1

END


GO




