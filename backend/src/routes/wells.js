const express = require('express');
const Joi = require('joi');
const router = express.Router();

// 验证井数据的模式
const wellSchema = Joi.object({
  numberOfWells: Joi.number().integer().min(1).max(100).required(),
  targetPoints: Joi.array().items(
    Joi.object({
      x: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required(), // 最多2位小数
      y: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required(), // 最多2位小数
      z: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required()  // 最多2位小数
    })
  ).required(),
  entryDirections: Joi.array().items(
    Joi.object({
      x: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required(), // 最多2位小数
      y: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required(), // 最多2位小数
      z: Joi.string().pattern(/^-?\d+(\.\d{1,2})?$/).required()  // 最多2位小数
    })
  ).required(),
  kickoffPoints: Joi.array().items(
    Joi.object({
      pkx: Joi.number().required(),
      pky: Joi.number().required(),
      pkz: Joi.number().required()
    })
  ).required(),
  kickoffDirections: Joi.array().items(
    Joi.object({
      vkx: Joi.number().required(),
      vky: Joi.number().required(),
      vkz: Joi.number().required()
    })
  ).required(),
  doglegPoints: Joi.array().items(
    Joi.object({
      dogleg: Joi.string().required(),
      radius: Joi.number().positive().required()
    })
  ).required()
});

// 格式化数值为两位小数
const formatToTwoDecimals = (value) => {
  const num = parseFloat(value);
  // 使用Math.floor保留最多2位小数
  if (isNaN(num)) return '0';
  const multiplied = num * 100;
  const floored = Math.floor(multiplied) / 100;
  return floored.toString();
};

// 处理井数据，确保精度
const processWellData = (data) => {
  // 处理目标点，确保最多2位小数
  if (data.targetPoints) {
    data.targetPoints = data.targetPoints.map(point => ({
      x: formatToTwoDecimals(point.x),
      y: formatToTwoDecimals(point.y),
      z: formatToTwoDecimals(point.z)
    }));
  }

  // 处理入口方向，确保最多2位小数
  if (data.entryDirections) {
    data.entryDirections = data.entryDirections.map(direction => ({
      x: formatToTwoDecimals(direction.x),
      y: formatToTwoDecimals(direction.y),
      z: formatToTwoDecimals(direction.z)
    }));
  }

  return data;
};

/**
 * @route POST /api/wells/validate
 * @description 验证井数据
 */
router.post('/validate', (req, res) => {
  try {
    const { error, value } = wellSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // 处理数据精度
    const processedData = processWellData(value);

    res.json({
      success: true,
      message: '井数据验证成功',
      data: processedData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: err.message
    });
  }
});

/**
 * @route POST /api/wells/save
 * @description 保存井数据
 */
router.post('/save', (req, res) => {
  try {
    const { error, value } = wellSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.details
      });
    }

    // 处理数据精度
    const processedData = processWellData(value);

    // 这里可以添加保存到数据库的逻辑
    console.log('保存井数据:', processedData);

    res.json({
      success: true,
      message: '井数据保存成功',
      data: {
        id: Date.now(), // 临时ID
        ...processedData,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: err.message
    });
  }
});

/**
 * @route GET /api/wells/:id
 * @description 获取井数据
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该从数据库获取数据，现在返回模拟数据
    const mockData = {
      id: parseInt(id),
      numberOfWells: 2,
      targetPoints: [
        { x: "100.50", y: "200.75", z: "-1500.00" },
        { x: "150.25", y: "250.80", z: "-1600.00" }
      ],
      entryDirections: [
        { x: "0.50", y: "0.75", z: "-1.00" },
        { x: "0.60", y: "0.80", z: "-1.00" }
      ],
      kickoffPoints: [
        { pkx: 0, pky: 0, pkz: -300.00 },
        { pkx: 0, pky: 0, pkz: -300.00 }
      ],
      kickoffDirections: [
        { vkx: 0, vky: 0, vkz: -1.00 },
        { vkx: 0, vky: 0, vkz: -1.00 }
      ],
      doglegPoints: [
        { dogleg: "3.00", radius: 859.44 },
        { dogleg: "3.00", radius: 859.44 }
      ],
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: err.message
    });
  }
});

module.exports = router;