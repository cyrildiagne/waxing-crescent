import argparse
import tqdm
import glob
import os
from PIL import Image


def resize_and_crop_square(img, size=64):
    w = img.size[0]
    h = img.size[1]
    img_ratio = w / h
    # Crop square
    if img_ratio > 1:  # Landscape
        x = int((w - h) / 2)
        box = (x, 0, x + h, h)
        img = img.crop(box)
    elif img_ratio < 1:  # Portrait
        y = int((h - w) / 2)
        box = (0, y, w, y + w)
        img = img.crop(box)
    # Resize
    img = img.resize((size, size), Image.LANCZOS)
    return img


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('pattern',
                        type=str,
                        help='input glob pattern')
    parser.add_argument('--output_folder',
                        default='moon64',
                        help='output folder')
    parser.add_argument('--size', default=64, help='square size')
    args = parser.parse_args()

    # Create the output folder if it doesn't exist
    if not os.path.exists(args.output_folder):
        os.makedirs(args.output_folder)

    files = glob.glob(args.pattern)
    for file in tqdm.tqdm(files):
        try:
            img = Image.open(file)
            img = resize_and_crop_square(img, args.size)
            if img.size[0] != args.size or img.size[1] != args.size:
                raise Exception('Wrong size %s %s' %
                                (img.size[0], img.size[1]))
            img.convert('RGB').save(args.output_folder + '/' +
                                    os.path.basename(file),
                                    quality=95)
        except Exception as e:
            print(file)
            print(e)
