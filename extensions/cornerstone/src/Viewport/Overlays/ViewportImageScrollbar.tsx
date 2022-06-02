import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Enums, Types, utilities } from '@cornerstonejs/core';
import {
  utilities as csToolsUtils,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
import { ImageScrollbar } from '@ohif/ui';

function CornerstoneImageScrollbar({
  viewportData,
  viewportIndex,
  element,
  imageSliceData,
  setImageSliceData,
  scrollbarHeight,
  CornerstoneViewportService,
}) {
  const slideTimeout = useRef(null);

  const onImageScrollbarChange = (imageIndex, viewportIndex) => {
    clearTimeout(slideTimeout.current);

    slideTimeout.current = setTimeout(() => {
      const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const viewport = CornerstoneViewportService.getCornerstoneViewport(
        viewportId
      );

      csToolsUtils.jumpToSlice(viewport.element, { imageIndex }).then(() => {
        setImageSliceData({
          ...imageSliceData,
          imageIndex: imageIndex,
        });
      });
    }, 40);
  };

  useEffect(() => {
    if (!viewportData) {
      return;
    }

    const viewport = CornerstoneViewportService.getCornerstoneViewportByIndex(
      viewportIndex
    );

    if (!viewport) {
      return;
    }

    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      const imageId = viewport.getCurrentImageId();
      const index = viewportData?.imageIds?.indexOf(imageId);

      if (index === -1) {
        return;
      }

      setImageSliceData({
        imageIndex: index,
        numberOfSlices: viewportData.imageIds.length,
      });

      return;
    }

    if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      const sliceData = utilities.getImageSliceDataForVolumeViewport(
        viewport as Types.IVolumeViewport
      );

      if (!sliceData) {
        return;
      }

      const { imageIndex, numberOfSlices } = sliceData;
      setImageSliceData({ imageIndex, numberOfSlices });
    }
  }, [viewportIndex, viewportData]);

  useEffect(() => {
    if (viewportData?.viewportType !== Enums.ViewportType.STACK) {
      return;
    }

    const updateStackIndex = event => {
      const { newImageIdIndex } = event.detail;
      // find the index of imageId in the imageIds
      setImageSliceData({
        imageIndex: newImageIdIndex,
        numberOfSlices: viewportData.imageIds.length,
      });
    };

    element.addEventListener(
      csToolsEnums.Events.STACK_SCROLL,
      updateStackIndex
    );

    return () => {
      element.removeEventListener(
        csToolsEnums.Events.STACK_SCROLL,
        updateStackIndex
      );
    };
  }, [viewportData, element]);

  useEffect(() => {
    if (viewportData?.viewportType !== Enums.ViewportType.ORTHOGRAPHIC) {
      return;
    }

    const updateVolumeIndex = event => {
      const { imageIndex, numberOfSlices } = event.detail;
      // find the index of imageId in the imageIds
      setImageSliceData({ imageIndex, numberOfSlices });
    };

    element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, updateVolumeIndex);

    return () => {
      element.removeEventListener(
        Enums.Events.VOLUME_NEW_IMAGE,
        updateVolumeIndex
      );
    };
  }, [viewportData, element]);

  return (
    <ImageScrollbar
      onChange={evt => onImageScrollbarChange(evt, viewportIndex)}
      max={
        imageSliceData.numberOfSlices ? imageSliceData.numberOfSlices - 1 : 0
      }
      height={scrollbarHeight}
      value={imageSliceData.imageIndex}
    />
  );
}

CornerstoneImageScrollbar.propTypes = {
  viewportData: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  element: PropTypes.instanceOf(Element),
  scrollbarHeight: PropTypes.string,
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
};

export default CornerstoneImageScrollbar;
