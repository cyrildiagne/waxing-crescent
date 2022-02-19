import argparse
import os
from pathlib import Path

import requests
from flickrapi import FlickrAPI
from PIL import Image

key = os.environ.get('FLICKR_API_KEY')
secret = os.environ.get('FLICKR_API_SECRET')


def get_name(uri):
    # Rename (remove wildcard characters)
    f = os.path.basename(uri)
    for c in ['%20', '%', '*', '~', '(', ')']:
        f = f.replace(c, '_')
    f = f[:f.index('?')] if '?' in f else f
    # Add suffix (if missing)
    if Path(f).suffix == '':
        f += '.' + Image.open(f).format.lower()
    return f


def download_uri(uri, output_folder='./'):
    f = os.path.join(output_folder, get_name(uri))
    with open(f, 'wb') as file:
        file.write(requests.get(uri, timeout=10).content)


def get_urls(search='moon', n=1000, output_folder='./'):
    flickr = FlickrAPI(key, secret)
    photos = flickr.walk(
        text=search,
        extras='url_o',
        per_page=500,
        #  license=(),
        sort='relevance')

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    urls = []
    for i, photo in enumerate(photos):
        if i < n:
            try:
                url = photo.get('url_o')
                if url is None:
                    url = 'https://farm%s.staticflickr.com/%s/%s_%s_b.jpg' % \
                          (photo.get('farm'), photo.get('server'), photo.get('id'), photo.get('secret'))
                # Check that the file doesn't already exists
                already_downloaded = os.path.exists(output_folder +
                                                    get_name(url))
                if already_downloaded:
                    print('file already downloaded')
                else:
                    download_uri(url, output_folder)
                urls.append(url)
                print('%g/%g %s' % (i, n, url))
            except:
                print('%g/%g error...' % (i, n))
    print('Done.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('search', type=str, help='The search term')
    parser.add_argument('--output_folder',
                        default='./images',
                        help='The output folder')
    parser.add_argument('--n',
                        type=int,
                        default=10,
                        help='The number of images')
    args = parser.parse_args()
    get_urls(search=args.search, n=args.n, output_folder=args.output_folder)
