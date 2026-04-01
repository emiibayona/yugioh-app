

type MeasureObj = { width: number; height: number } | null;

export function useBoundaries() {
    // Values in absolute pixels for the UI overlays (borders)
    const boundaries = { height: 180, width: 40 }
    const padding = 10;

    // Card Sample layout constants
    const cardLayout = {
        name: {
            widthPercent: 0.82,
            height: 30,
        },
        effect: {
            widthPercent: 1.0,
            height: 100,
        }
    };

    function getBoundaries(screen: MeasureObj) {
        if (!screen) return;
        return {
            topLeft: { x: boundaries.width, y: boundaries.height },
            topRight: { x: screen.width - boundaries.width, y: boundaries.height },
            bottomLeft: { x: boundaries.width, y: screen.height - boundaries.height },
            bottomRight: { x: screen.width - boundaries.width, y: screen.height - boundaries.height },
        }
    }

    function getCropOptions(photo: MeasureObj, screen: MeasureObj) {
        if (!photo || !screen) return null;

        // Calculate scaling factors
        // Assuming the photo aspect ratio might differ from screen aspect ratio
        // and that 'cover' mode is used for the camera preview.
        const scaleX = photo.width / screen.width;
        const scaleY = photo.height / screen.height;

        // In 'cover' mode, one dimension matches and the other is cropped.
        // We use the larger scale to ensure the image covers the screen.
        const scale = Math.max(scaleX, scaleY);

        // Offset if the photo is larger than the screen (due to 'cover' resize mode)
        const offsetX = (photo.width - screen.width * scale) / 2;
        const offsetY = (photo.height - screen.height * scale) / 2;

        const mapToPhoto = (x: number, y: number, w: number, h: number) => ({
            originX: Math.floor(x * scale + offsetX),
            originY: Math.floor(y * scale + offsetY),
            width: Math.floor(w * scale),
            height: Math.floor(h * scale)
        });

        const screenContentWidth = screen.width - 2 * boundaries.width - 2 * padding;
        const screenContentHeight = screen.height - 2 * boundaries.height - 2 * padding;

        const nameCrop = mapToPhoto(
            boundaries.width + padding,
            boundaries.height + padding,
            screenContentWidth * cardLayout.name.widthPercent,
            cardLayout.name.height
        );

        const effectCrop = mapToPhoto(
            boundaries.width + padding,
            screen.height - boundaries.height - padding - cardLayout.effect.height,
            screenContentWidth * cardLayout.effect.widthPercent,
            cardLayout.effect.height
        );

        return {
            name: { crop: nameCrop },
            effect: { crop: effectCrop }
        };
    }

    function transpolateCoordinates(coordinates: { x: number, y: number }, snap: MeasureObj, screen: MeasureObj) {
        if (!screen || !snap) return;

        const ratio = snap.width / screen.width;
        return { x: coordinates.x * ratio, y: coordinates.y * ratio };
    }


    function getBoxCoordinates(width: number, height: number, padding: number) {

        const xAnchor = boundaries.width + padding + 10;
        const yAnchor = boundaries.height + padding;

        return {
            topLeft: {
                x: xAnchor,
                y: yAnchor
            },
            topRight: {
                x: xAnchor + width,
                y: yAnchor
            },
            bottomLeft: {
                x: xAnchor,
                y: yAnchor + height
            },
            bottomRight: {
                x: xAnchor + width,
                y: yAnchor + height
            },
        }

    }
    return {
        getBoundaries,
        getCropOptions,
        getBoxCoordinates,
        boundaries
    }
}