"use strict";

const _ = require('underscore');
const tf = require('@tensorflow/tfjs-node-gpu');

const SIZE          = 11;
const PLANE_COUNT   = 1;

const BATCH_SIZE    = 1024;
const EPOCH_COUNT   = 100;
const VALID_SPLIT   = 0.1;
const LEARNING_RATE = 0.001;
const DROPOUT_RATE  = 0.05;
const FREEZE_CNT    = 0;

const FILE_PREFIX = 'file:///users/valen';

async function init() {
    await tf.ready();
    await tf.enableProdMode();
    console.log(tf.getBackend());
}

async function load(url, logger) {
    const t0 = Date.now();
    await init();
    const model = await tf.loadLayersModel(url);
    for (let i = 0; i < FREEZE_CNT; i++) {
        const l = model.getLayer(null, i);
        l.trainable = false;
    }
    const opt = tf.train.sgd(LEARNING_RATE);
    model.compile({optimizer: 'sgd', loss: ['categoricalCrossentropy', 'meanSquaredError'], metrics: ['accuracy']});
//  model.summary();
    const t1 = Date.now();
    console.log('Model [' + url + '] loaded: ' + (t1 - t0));
    if (!_.isUndefined(logger)) {
        logger.info('Model [' + url + '] loaded: ' + (t1 - t0));
    }
    return model;
}

async function create(logger) {
    const t0 = Date.now();
    await init();

    const model = tf.sequential();
    const shape = [PLANE_COUNT, SIZE, SIZE];

    model.add(tf.layers.zeroPadding2d({padding: 3, inputShape: shape, dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 48, kernelSize: [7, 7], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 512, activation: 'relu'}));    
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

/*
    model.add(tf.layers.zeroPadding2d({padding: [2, 2], inputShape: shape, dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: [5, 5], padding: 'valid', dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: [2, 2], dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: [1, 1], dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: [3, 3], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: [1, 1], dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: [3, 3], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.zeroPadding2d({padding: [1, 1], dataFormat: 'channelsFirst'}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: [3, 3], dataFormat: 'channelsFirst', activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 512, activation: 'relu'}));
    if (DROPOUT_RATE > 0) {
        model.add(tf.layers.dropout({rate: DROPOUT_RATE}));
    }
*/

    model.add(tf.layers.dense({units: SIZE * SIZE, activation: 'softmax'}));
    const opt = tf.train.sgd(LEARNING_RATE);
    model.compile({optimizer: 'sgd', loss: 'categoricalCrossentropy', metrics: ['accuracy']});

    const t1 = Date.now();
    console.log('Model created: ' + (t1 - t0));
    if (!_.isUndefined(logger)) {
        logger.info('Model created: ' + (t1 - t0));
    }
    
    return model;
}

async function createEx(logger) {
    const t0 = Date.now();
    await init();

    const shape = [PLANE_COUNT, SIZE, SIZE];

    const input = tf.input({shape: shape});
    const z1 = tf.layers.zeroPadding2d({padding: 3, dataFormat: 'channelsFirst'}).apply(input);
    const c1 = tf.layers.conv2d({filters: 48, kernelSize: [7, 7], dataFormat: 'channelsFirst', activation: 'relu'}).apply(z1);
    const d1 = tf.layers.dropout({rate: DROPOUT_RATE}).apply(c1);

    const z2 = tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}).apply(d1);
    const c2 = tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}).apply(z2);
    const d2 = tf.layers.dropout({rate: DROPOUT_RATE}).apply(c2);

    const z3 = tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}).apply(d2);
    const c3 = tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}).apply(z3);
    const d3 = tf.layers.dropout({rate: DROPOUT_RATE}).apply(c3);

    const z4 = tf.layers.zeroPadding2d({padding: 2, dataFormat: 'channelsFirst'}).apply(d3);
    const c4 = tf.layers.conv2d({filters: 32, kernelSize: [5, 5], dataFormat: 'channelsFirst', activation: 'relu'}).apply(z4);
    const d4 = tf.layers.dropout({rate: DROPOUT_RATE}).apply(c4);

    const fl = tf.layers.flatten().apply(d4);
    const out = tf.layers.dense({units: 512, activation: 'relu'}).apply(fl);
    const dr = tf.layers.dropout({rate: DROPOUT_RATE}).apply(out);

    const ph = tf.layers.dense({units: 512, activation: 'relu'}).apply(dr);
    const policy = tf.layers.dense({units: SIZE * SIZE, activation: 'softmax'}).apply(ph);

    const vh = tf.layers.dense({units: 512, activation: 'relu'}).apply(dr);
    const value = tf.layers.dense({units: 1, activation: 'tanh'}).apply(vh);

    const model = tf.model({inputs: input, outputs: [policy, value]});
    const opt = tf.train.sgd(LEARNING_RATE);
    model.compile({optimizer: 'sgd', loss: ['categoricalCrossentropy', 'meanSquaredError'], metrics: ['accuracy']});
   
    const t1 = Date.now();
    console.log('Model created: ' + (t1 - t0));
    if (!_.isUndefined(logger)) {
        logger.info('Model created: ' + (t1 - t0));
    }
    return model;
}

async function fit(model, size, x, y, batch, logger) {
    const xshape = [batch, PLANE_COUNT, size, size];
    const xs = tf.tensor4d(x, xshape, 'float32');
    const yshape = [batch, size * size];
    const ys =  tf.tensor2d(y, yshape, 'float32');

    const t0 = Date.now();
    const h = await model.fit(xs, ys, {
        batchSize: BATCH_SIZE,
        epochs: EPOCH_COUNT/*,
        validationSplit: VALID_SPLIT*/
    });    

//  console.log(h);
    for (let i = 0; i < EPOCH_COUNT; i++) {
        console.log('epoch = ' + i + ', acc = ' + h.history.acc[i] + ', loss = ' + h.history.loss[i] /*+ ', val_acc = ' + h.history.val_acc[i] + ', val_loss = ' + h.history.val_loss[i]*/);
        if (!_.isUndefined(logger)) {
            logger.info('epoch = ' + i + ', acc = ' + h.history.acc[i] + ', loss = ' + h.history.loss[i] /*+ ', val_acc = ' + h.history.val_acc[i] + ', val_loss = ' + h.history.val_loss[i]*/);
        }
    }
    const t1 = Date.now();
    console.log('Fit time: ' + (t1 - t0));
    if (!_.isUndefined(logger)) {
        logger.info('Fit time: ' + (t1 - t0));
    }

    xs.dispose();
    ys.dispose();
}

async function fitEx(model, size, x, y, z, batch, logger) {
    const xshape = [batch, PLANE_COUNT, size, size];
    const xs = tf.tensor4d(x, xshape, 'float32');
    const yshape = [batch, size * size];
    const ys =  tf.tensor2d(y, yshape, 'float32');
    const zshape = [batch, 1];
    const zs =  tf.tensor2d(z, zshape, 'float32');

    const t0 = Date.now();
    const h = await model.fit(xs, [ys, zs], {
        batchSize: BATCH_SIZE,
        epochs: EPOCH_COUNT
    });    

//  console.log(h);
    for (let i = 0; i < EPOCH_COUNT; i++) {
        console.log('epoch = ' + i + ', acc = [' + h.history.dense_Dense3_acc[i] + ' ,' + h.history.dense_Dense5_acc[i] + '], loss = [' + h.history.dense_Dense3_loss[i] + ' ,' + h.history.dense_Dense5_loss[i] + ' ,' + h.history.loss[i] + ']');
        if (!_.isUndefined(logger)) {
            logger.info('epoch = ' + i + ', acc = [' + h.history.dense_Dense3_acc[i] + ' ,' + h.history.dense_Dense5_acc[i] + '], loss = [' + h.history.dense_Dense3_loss[i] + ' ,' + h.history.dense_Dense5_loss[i] + ' ,' + h.history.loss[i] + ']');
        }
    }
    const t1 = Date.now();
    console.log('Fit time: ' + (t1 - t0));
    if (!_.isUndefined(logger)) {
        logger.info('Fit time: ' + (t1 - t0));
    }

    xs.dispose();
    ys.dispose();
    zs.dispose();
}

async function save(model, fileName) {
    await model.save(`${FILE_PREFIX}/${fileName}`);
}

module.exports.SIZE = SIZE;
module.exports.PLANE_COUNT = PLANE_COUNT;

module.exports.load = load;
module.exports.create = createEx;
module.exports.fit = fitEx;
module.exports.save = save;
