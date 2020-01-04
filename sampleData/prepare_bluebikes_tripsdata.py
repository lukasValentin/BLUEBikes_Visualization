#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Jan  3 16:55:20 2020

@author: Lukas Graf (graflukas@web.de)
"""
import os
import glob
import datetime
import wget
import zipfile
import pandas as pd


def download_data(url, zip_file):
    """download the data in zip format from amazonaws"""
    return wget.download(url, zip_file)


def unpack(zip_file):
    """unpacks the zipped trips data"""
    zipped = zipfile.ZipFile(zip_file)
    # unpack into the current directory
    zipped.extractall()
    zipped.close()
    # search for the extracted file (assume it is the latest *.csv 
    # file as the filename is not known beforehand)
    unzipped = max(glob.iglob('*.csv'), key=os.path.getctime)
    # read in the data into a pandas dataframe
    return pd.read_csv(unzipped)


def prepare(df):
    """prepares the downloaded data for further processing"""
    # trips lasting longer than 24 hours (24 * 60 min) are considered outliers
    df = df[df['tripduration'] <= 24*60]
    # clean up the dataframe by dropping rows containings NaNs
    df = df.dropna()
    # generate a "age_segment" column to classify the age into intervals
    # calculate the age from the current year minus the birth year
    df['age'] = datetime.datetime.now().year - df['birth year']
    # classify the age into classes
    segments = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    seg_name = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', \
                    '60-70', '70-80', '80-90', '90-100']
    df['age_segments'] = pd.cut(df['age'], segments , labels = seg_name)
    # remove milli-seconds from timestamps
    df['starttime'] =  pd.to_datetime(df['starttime']).dt.strftime('%Y-%m-%d %H:%M:%S')
    # drop all the columns that are required further
    keep_cols = ['start station latitude', 'start station longitude', \
                 'starttime', 'tripduration', \
                 'usertype', 'gender', 'age_segments']
    df = df[keep_cols]
    # convert to JSON
    return df.to_json('BLUEBikes.json')


if __name__ == '__main__':
    # set the url to the amazonaws web storage and select the data
    url = "https://s3.amazonaws.com/hubway-data/201910-bluebikes-tripdata.zip"
    zip_file = 'bikes-201910.zip'
    # download the data
    downloaded = download_data(url, zip_file)
    # unpack the downloaded data
    unpacked = unpack(downloaded)
    # prepare data and convert to json
    json_data = prepare(unpacked)
