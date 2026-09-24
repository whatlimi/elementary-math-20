# -*- coding: utf-8 -*-
import os, sys
import imageio_ffmpeg

exe = imageio_ffmpeg.get_ffmpeg_exe()
os.environ['PATH'] = os.path.dirname(exe) + os.pathsep + os.environ['PATH']
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from manim.__main__ import main

sys.argv = ['manim', 'render', '-ql', '--disable_caching', 'mten.py', 'MakeTen']
main()