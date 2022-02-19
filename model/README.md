# Download the dataset

```bash
cd model/data
```

Download images from Flickr:

```bash
export FLICKR_API_KEY="your flickr api key"
export FLICKR_API_SECRET="your flickr api key"
python download_images.py moon --n 10 --output_folder './moon-images/'
```

Then resize & crop the images to 64x64 squares:

```bash
python data/export_square.py './moon-images/*.jpg' --size 64
```

# Train

- First, train StyleGAN2-ADA using the official repo: https://github.com/NVlabs/stylegan2-ada-pytorch

- Convert the model to the rosinality format using [this script](https://github.com/dvschultz/stylegan2-ada-pytorch/blob/main/export_weights.py)

  ```bash
  SNAPSHOTS_PATH=../training-runs
  python export_weights.py \
    $SNAPSHOTS_PATH/network-snapshot.pkl \
    $SNAPSHOTS_PATH/network-snapshot.pt
  ```

- Clone MobileStyleGan: https://github.com/bes-dev/MobileStyleGAN.pytorch

- Convert the model from rosinality to MobileStyleGan using [this script](https://github.com/bes-dev/MobileStyleGAN.pytorch/blob/develop/convert_rosinality_ckpt.py)

  ```bash
  SNAPSHOTS_PATH=../training-runs
  python export_weights.py \
    --ckpt $SNAPSHOTS_PATH/network-snapshot.pt \
    --ckpt-mnet $SNAPSHOTS_PATH/network-snapshot-mapping.pt \
    --ckpt-snet $SNAPSHOTS_PATH/network-snapshot-synthesis.pt \
    --cfg-path $SNAPSHOTS_PATH/config.json
  ```

- Follow the instructions from the repo's README to train MobileStyleGan

- Finally, export the model to ONNX:

  ```bash
  SNAPSHOTS_PATH=../training-runs
  python train.py \
    --cfg $SNAPSHOTS_PATH/config.json \
    --ckpt $SNAPSHOTS_PATH/best.ckpt \
    --export-model onnx \
    --export-dir $SNAPSHOTS_PATH
  ```

<!--
# Train

First train StyleGAN2-ADA using [this fork](https://github.com/cyrildiagne/stylegan-ada-pytorch)

```bash
sh run_grid.sh
```

Convert the model to the rosinality format

```bash
cd stylegan2-ada-pytorch
sh convert.sh
```

Convert the model from rosinality to the MobileStyleGan format using [this fork](https://github.com/cyrildiagne/mobile-stylegan2).

```bash
cd mobile-stylegan2
sh convert.sh
```

Create a dataset on Grid.ai using model the snapshot files:

```bash
config.json
network-snapshot-mapping.pt
network-snapshot-synthesis.pt
```

Then train the MobileStyleGAN student network

```bash
sh train_grid.sh
```

# Export

Export the mobile stylegan model to onnx:

```bash
sh export.sh
```
-->
