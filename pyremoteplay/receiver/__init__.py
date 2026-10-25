"""AV Receivers for pyremoteplay."""

from __future__ import annotations

import abc
import logging
import warnings
from collections import deque
from struct import unpack_from
from typing import Sequence, TYPE_CHECKING

if TYPE_CHECKING:
    from pyremoteplay.session import Session

_LOGGER = logging.getLogger(__name__)


class AVReceiver(abc.ABC):
    """Base Class for AV Receiver. Abstract. Must use subclass for session.

    This class exposes the audio/video stream of the Remote Play Session.
    The `handle_video` and `handle_audio` methods need to be reimplemented.
    Re-implementing this class provides custom handling of audio and video frames.
    """

    AV_CODEC_OPTIONS_H264 = {
        # "profile": "0",
        # "level": "3.2",
        "tune": "zerolatency",
        "preset": "ultrafast",
    }

    AV_CODEC_OPTIONS_HEVC = {
        "tune": "zerolatency",
        "preset": "ultrafast",
    }

    def __init__(self):
        self._session: Session = None
        self._video_format = "rgb24"
        self._audio_resampler = None
        self._audio_config = {}

    def _set_session(self, session: Session):
        self._session = session

    def handle_video_data(self, buf: bytes):
        """Handle video data."""
        raise NotImplementedError

    def handle_audio_data(self, buf: bytes):
        """Handle audio data."""
        raise NotImplementedError

    def close(self):
        """Close Receiver."""
        pass

    @property
    def video_format(self):
        """Return Video Format Name."""
        return self._video_format

    @video_format.setter
    def video_format(self, video_format: str):
        """Set Video Format."""
        self._video_format = video_format

    @property
    def audio_config(self) -> dict:
        """Return Audio config."""
        return dict(self._audio_config)
