const NewBill = require('../models/newBillModel');
const moment  = require('moment-timezone');

/**
 * GET /api/sales/total?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Devuelve el total de ventas (suma de totalAmount) entre dos fechas, inclusivo.
 */




exports.getTotalSalesInRange = async (req, res) => {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Debes enviar los parámetros from y to en formato YYYY-MM-DD'
        });
      }
  
      const zone   = 'America/Bogota';
      const inicio = moment.tz(from, 'YYYY-MM-DD', zone).startOf('day').toDate();
      const fin    = moment.tz(to,   'YYYY-MM-DD', zone).endOf('day').toDate();
  
      // 1) Total de ventas
      const agg = await NewBill.aggregate([
        { $match: { createdAt: { $gte: inicio, $lte: fin } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            invoiceCount: { $sum: 1 }
          }
        },
        { $project: { _id: 0, totalSales: 1, invoiceCount: 1 } }
      ]);
  
      const { totalSales: totalNumeric = 0, invoiceCount = 0 } = agg[0] || {};
  
      // 2) Formatear a pesos colombianos
      const formatter = new Intl.NumberFormat('es-CO', {
        style:    'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      });
      const totalFormatted = formatter.format(totalNumeric);
  
      return res.json({
        success:      true,
        from,
        to,
        totalSales:   totalFormatted,
        totalNumeric,      // opcional: valor numérico sin formatear
        totalInvoices: invoiceCount
      });
    } catch (err) {
      console.error('Error en getTotalSalesInRange:', err);
      res.status(500).json({
        success: false,
        error:   'Error al calcular el total de ventas en el rango'
      });
    }
  };

  
exports.getTotalByPaymentMethodsOnDate = async (req, res) => {
  try {
    // Parámetro obligatorio ?date=YYYY-MM-DD
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Debes enviar el parámetro date en formato YYYY-MM-DD' });
    }

    // Calcula inicio y fin del día en Bogotá
    const zona  = 'America/Bogota';
    const inicio = moment.tz(date, 'YYYY-MM-DD', zona).startOf('day').toDate();
    const fin    = moment.tz(date, 'YYYY-MM-DD', zona).endOf('day').toDate();

    // Agregación: filtra por createdAt, agrupa por medioPago y suma totalAmount
    const totals = await NewBill.aggregate([
      { $match: { createdAt: { $gte: inicio, $lte: fin } } },
      { $group: { _id: '$medioPago', total: { $sum: '$totalAmount' } } },
      { $project: { _id: 0, medioPago: '$_id', total: 1 } }
    ]);

    res.json({
      success: true,
      date,
      data: totals
    });
  } catch (err) {
    console.error('Error en getTotalByPaymentMethodsOnDate:', err);
    res.status(500).json({ success: false, error: 'Error al calcular totales por método de pago' });
  }
};