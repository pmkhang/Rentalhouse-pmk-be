import { v4 } from 'uuid';
import db from '../models';
import { Op } from 'sequelize';
import generateCode from '../utils/generateCode';
import moment from 'moment';
import generateDate from '../utils/generateDate';

require('dotenv').config();

export const getPostsService = () =>
  new Promise(async (resolve, reject) => {
    try {
      const idSet = new Set();

      const response = await db.Post.findAll({
        raw: true,
        nest: true,
        include: [
          { model: db.Image, as: 'images', attributes: ['image'] },
          { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
          { model: db.User, as: 'users', attributes: ['name', 'phone', 'zalo'] },
          { model: db.Label, as: 'labels', attributes: ['code', 'value'] },
        ],
        attributes: ['id', 'title', 'star', 'address', 'desc'],
      });

      // Lọc các Id trùng lặp
      const filteredResponse = response.filter((post) => {
        if (!idSet.has(post.id)) {
          idSet.add(post.id);
          return true;
        }
        return false;
      });

      resolve({
        error: filteredResponse.length > 0 ? 0 : 1,
        message: filteredResponse.length > 0 ? 'Ok' : 'No unique posts found',
        response: filteredResponse,
      });
    } catch (error) {
      console.log('Error getPostsService: ', error);
      reject(error);
    }
  });

// export const getPostsLimitService = (page, query) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       const idSet = new Set();

//       const response = await db.Post.findAndCountAll({
//         where: query,
//         raw: true,
//         nest: true,
//         offset: page * +process.env.LIMIT || 0,
//         limit: +process.env.LIMIT,
//         include: [
//           { model: db.Image, as: 'images', attributes: ['image'] },
//           { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
//           { model: db.User, as: 'users', attributes: ['name', 'phone', 'zalo'] },
//           { model: db.Label, as: 'labels', attributes: ['code', 'value'] },
//         ],
//         attributes: ['id', 'title', 'star', 'address', 'desc'],
//       });

//       const { count, rows } = response;

//       // Filter the rows (posts)
//       const filteredResponse = rows.filter((post) => {
//         if (!idSet.has(post.id)) {
//           idSet.add(post.id);
//           return true;
//         }
//         return false;
//       });

//       resolve({
//         error: filteredResponse.length > 0 ? 0 : 1,
//         message: filteredResponse.length > 0 ? 'Ok' : 'No unique posts found',
//         response: {
//           count: count,
//           rows: filteredResponse,
//         },
//       });
//     } catch (error) {
//       console.log('Error getPostsService: ', error);
//       reject(error);
//     }
//   });

export const getPostsLimitService = (page, { limitPost, order, ...query }, { priceNumber, acreageNumber }) =>
  new Promise(async (resolve, reject) => {
    try {
      const idSet = new Set();
      const offset = !page || +page <= 1 ? 0 : +page - 1;
      const queries = { ...query };
      const limit = +limitPost || +process.env.LIMIT;
      queries.limit = limit;
      if (priceNumber) query.priceNumber = { [Op.between]: priceNumber };
      if (acreageNumber) query.acreageNumber = { [Op.between]: acreageNumber };
      if (order) queries.order = [order];
      const response = await db.Post.findAndCountAll({
        where: query,
        raw: true,
        nest: true,
        offset: offset * limit,
        ...queries,
        include: [
          { model: db.Image, as: 'images', attributes: ['image'] },
          { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
          { model: db.User, as: 'users', attributes: ['name', 'phone', 'zalo', 'avatar'] },
          { model: db.Label, as: 'labels', attributes: ['code', 'value'] },
          { model: db.Overview, as: 'overviews' },
        ],
        attributes: ['id', 'title', 'star', 'address', 'desc', 'createdAt'],
      });
      const { count, rows } = response;
      const filteredResponse = rows.filter((post) => {
        if (!idSet.has(post.id)) {
          idSet.add(post.id);
          return true;
        }
        return false;
      });
      resolve({
        error: filteredResponse.length > 0 ? 0 : 1,
        message: filteredResponse.length > 0 ? 'Ok' : 'No unique posts found',
        response: {
          count: count,
          rows: filteredResponse,
        },
      });
    } catch (error) {
      reject(error);
    }
  });

export const getNewPostsService = () =>
  new Promise(async (resolve, reject) => {
    const idSet = new Set();

    try {
      const response = await db.Post.findAll({
        raw: true,
        nest: true,
        offset: 0,
        order: [['createdAt', 'DESC']],
        limit: +process.env.LIMIT,
        include: [
          { model: db.Image, as: 'images', attributes: ['image'] },
          { model: db.Attribute, as: 'attributes', attributes: ['price'] },
        ],
        attributes: ['id', 'title', 'star', 'createdAt'],
      });

      const filteredResponse = response.filter((post) => {
        if (!idSet.has(post.id)) {
          idSet.add(post.id);
          return true;
        }
        return false;
      });

      resolve({
        error: filteredResponse.length > 0 ? 0 : 1,
        message: filteredResponse.length > 0 ? 'Ok' : 'No unique posts found',
        response: filteredResponse,
      });
    } catch (error) {
      reject(error);
    }
  });

export const getUserPostsService = (page, id, query) =>
  new Promise(async (resolve, reject) => {
    try {
      const idSet = new Set();
      const offset = !page || +page <= 1 ? 0 : +page - 1;
      const queries = { ...query, userID: id };
      const response = await db.Post.findAndCountAll({
        where: queries,
        raw: true,
        nest: true,
        offset: offset * +process.env.LIMIT,
        order: [['createdAt', 'DESC']],
        limit: +process.env.LIMIT,
        include: [
          { model: db.Image, as: 'images', attributes: ['image'] },
          { model: db.Attribute, as: 'attributes' },
          { model: db.Overview, as: 'overviews' },
          { model: db.Label, as: 'labels' },
        ],
        // attributes: ['id', 'title', 'star', 'address', 'desc'],
      });

      const { count, rows } = response;
      const filteredResponse = rows.filter((post) => {
        if (!idSet.has(post.id)) {
          idSet.add(post.id);
          return true;
        }
        return false;
      });

      resolve({
        error: filteredResponse.length > 0 ? 0 : 1,
        message: filteredResponse.length > 0 ? 'Ok' : 'No unique posts found',
        response: {
          count: count,
          rows: filteredResponse,
        },
      });
    } catch (error) {
      reject(error);
    }
  });

export const createNewPostService = (body, id) =>
  new Promise(async (resolve, reject) => {
    try {
      const postID = generateCode(v4() + attributesID);
      const attributesID = generateCode(v4() + v4());
      const overviewID = generateCode(v4() + v4() + v4());
      const imagesID = generateCode(v4() + v4() + v4() + v4());
      const labelCode = generateCode(body?.label.trim());
      const hashtag = generateCode(v4() + v4() + v4() + v4() + v4());
      const province = body?.provinceName?.replace(/thành phố|Thành phố|Thành Phố|tỉnh|Tỉnh/g, '').trim();
      const currentDate = generateDate();

      await db.Post.create({
        id: postID,
        title: body?.title,
        star: body?.star,
        labelCode: labelCode,
        address: body?.address,
        attributesID: attributesID,
        categoryCode: body?.categoryCode,
        desc: JSON.stringify(body?.desc),
        userID: id,
        overviewID: overviewID,
        imagesID: imagesID,
        priceCode: body?.priceCode,
        acreageCode: body?.acreageCode,
        provinceCode: generateCode(province),
        priceNumber: +body?.priceNumber,
        acreageNumber: +body?.acreageNumber,
      });

      await db.Attribute.create({
        id: attributesID,
        price: `${
          body?.priceNumber >= 1 ? body?.priceNumber + ' triệu/tháng' : body?.priceNumber * 10 ** 6 + ' đồng/tháng'
        }`,
        acreage: body?.acreageNumber + 'm2',
        published: moment(currentDate).format('DD/MM/YYYY'),
        hashtag: '#' + hashtag,
      });

      await db.Image.create({
        id: imagesID,
        image: body?.images,
      });

      await db.Overview.create({
        id: overviewID,
        code: '#' + hashtag,
        area: body?.label,
        type: body?.categoryName,
        target: body?.target,
        bonus: 'Tin thường',
        created: currentDate?.today,
        expired: currentDate?.expireDay,
      });

      await db.Province.findOrCreate({
        where: { code: generateCode(province) },
        defaults: {
          code: generateCode(province),
          value: province,
        },
      });

      await db.Label.findOrCreate({
        where: { code: labelCode },
        defaults: {
          code: labelCode,
          value: body?.label,
        },
      });
      resolve({
        error: 0,
        message: 'Ok',
      });
    } catch (error) {
      console.log('Create Post Fail: ', error);
      reject(error);
    }
  });

export const updateUserPostsService = ({ postID, overviewID, imagesID, attributesID, ...body }) =>
  new Promise(async (resolve, reject) => {
    try {
      const labelCode = generateCode(body?.label.trim());
      const province = body?.provinceName?.replace(/thành phố|Thành phố|Thành Phố|tỉnh|Tỉnh/g, '').trim();

      await db.Post.update(
        {
          title: body?.title,
          star: body?.star,
          labelCode: labelCode,
          address: body?.address,
          categoryCode: body?.categoryCode,
          desc: JSON.stringify(body?.desc),
          priceCode: body?.priceCode,
          acreageCode: body?.acreageCode,
          provinceCode: generateCode(province),
          priceNumber: body?.priceNumber,
          acreageNumber: body?.acreageNumber,
        },
        {
          where: { id: postID },
        },
      );

      await db.Attribute.update(
        {
          price: `${
            body?.priceNumber >= 1 ? body?.priceNumber + ' triệu/tháng' : body?.priceNumber * 10 ** 6 + ' đồng/tháng'
          }`,
          acreage: body?.acreageNumber + 'm2',
        },
        {
          where: { id: attributesID },
        },
      );

      await db.Image.update(
        {
          image: body?.images,
        },
        {
          where: { id: imagesID },
        },
      );

      await db.Overview.update(
        {
          area: body?.label,
          type: body?.categoryName,
          target: body?.target,
        },
        {
          where: { id: overviewID },
        },
      );

      await db.Province.findOrCreate({
        where: { code: generateCode(province) },
        defaults: {
          code: generateCode(province),
          value: province,
        },
      });

      await db.Label.findOrCreate({
        where: { code: labelCode },
        defaults: {
          code: labelCode,
          value: body?.label,
        },
      });

      resolve({
        error: 0,
        message: 'Updated',
      });
    } catch (error) {
      reject(error);
      console.log('updateUserPostsService error: ', error);
    }
  });

export const delUserPostService = (postID, attributesID, overviewID, labelCode, imagesID) =>
  new Promise(async (resolve, reject) => {
    try {
      await db.Post.destroy({
        where: { id: postID },
      });
      await db.Attribute.destroy({
        where: { id: attributesID },
      });
      await db.Overview.destroy({
        where: { id: overviewID },
      });
      await db.Label.destroy({
        where: { code: labelCode },
      });
      await db.Image.destroy({
        where: { id: imagesID },
      });
      resolve({
        error: 0,
        message: 'Deleted successfully',
      });
    } catch (error) {
      reject(error);
      console.log('delUserPostService error: ', error);
    }
  });
