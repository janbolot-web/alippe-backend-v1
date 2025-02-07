import userModel from "../models/user-model.js";
import qs from "qs";
import axios from "axios";
import crypto from "crypto";
import xml2js from "xml2js";
import purchaseHistoryModel from "../models/purchaseHistory-model.js";

var signatureCode;

export const createPayment = async (req, res) => {
  const { amount, description, successUrl, paymentMethod, userId } = req.body;
  const orderId = Date.now(); // Возвращает количество миллисекунд с 1 января 1970 года
  try {
    const API_URL = "https://api.freedompay.kg/init_payment.php";
    getSignature(orderId, amount, description, successUrl, paymentMethod);
    // const id =

    // Исходные данные
    const requestData = {
      pg_order_id: orderId,
      pg_merchant_id: process.env.PAYBOX_MERCHANT_ID, // Замените на свой merchant ID
      pg_amount: amount,
      pg_description: description,
      pg_salt: "random string",
      pg_sig: signatureCode, // Замените на свой pg_sig
      pg_currency: "KGS",
      pg_success_url: successUrl, // Ваш URL для успешного ответа
      pg_payment_method: paymentMethod,
      pg_timeout_after_payment: "10",
      // pg_testing_mode: "1",
    };
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const response = await axios
      .post(API_URL, qs.stringify(requestData), { headers })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        return error;
      });

    var jsonResponse;
    if (response.status == 200) {
      const parser = new xml2js.Parser();
      parser.parseString(response.data, (err, result) => {
        if (err) {
          console.error("Ошибка преобразования XML в JSON:", err);
        } else {
          jsonResponse = result;
          // purchaseService(userId, amount, pay);
          // applyDiscount(userId);
        }
      });
      console.log(jsonResponse);
      res
        .status(200)
        .json({ message: "Ссылка на оплату создано!", data: jsonResponse });
    } else {
      res.status(500).json({ error: "error", status: response.status });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create store", error: error.message });
  }
};

// Покупка услуги
async function purchaseService(data, userId, product, planPoint, quizPoint) {
  try {
    const pointsEarned = Math.floor(data.pg_amount[0] / 5); // Например, 1 балл за каждые 5 у.е.

    // Находим и обновляем пользователя, возвращая актуальные данные
    let updatedUser = await userModel.findOneAndUpdate(
      { _id: userId }, // Условие поиска
      {
        $inc: { points: pointsEarned }, // Увеличиваем количество баллов
      },
      { new: true } // Возвращаем обновленного пользователя
    );

    if (!updatedUser) throw new Error("Пользователь не найден");

    // Обновляем подписку
    const existingSubscription = updatedUser.subscription.find(
      (sub) => sub.title === product
    );

    if (existingSubscription) {
      // Если продукт найден, обновляем дату окончания
      existingSubscription.expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 дней
      );
    } else {
      // Если продукт не найден, добавляем новую подписку
      if (product == "ai") {
        updatedUser.subscription.push({
          title: product,
          isActive: true,
          planPoint: planPoint,
          quizPoint: quizPoint,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        });
        console.log("ai", updatedUser);
      } else {
        updatedUser.subscription.push({
          title: product,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        });
      }
    }

    // // Создаем запись о покупке
    // const purchase = new purchaseHistoryModel({
    //   paymentId: data.pg_payment_id[0],
    //   amount: data.pg_amount[0],
    //   date: data.pg_create_date[0],
    //   pointsEarned,
    //   currency: data.pg_currency[0],
    //   paymentMethod: data.pg_payment_method[0],
    //   // cardPan: data.pg_card_pan[0],
    //   authCode: data.pg_auth_code[0],
    //   pgSalt: data.pg_salt[0],
    //   pgSig: data.pg_sig[0],
    //   cardName: data.pg_card_name[0],
    //   userPhone: data.pg_user_phone[0],
    //   userEmail: data.pg_user_email[0],
    // });

    // // Добавляем покупку в историю пользователя
    // updatedUser.purchaseHistory.push(purchase._id);

    // // Сохраняем изменения
    // await purchase.save();
    await updatedUser.save();
    console.log("Покупка успешно сохранена");

    // console.log("Обновленный пользователь:", );
  } catch (error) {
    console.log("Ошибка:", error);
  }
}

export const getStatusPayment = async (req, res) => {
  try {
    const { paymentId, userId, amount, product, planPoint, quizPoint } =
      req.body;

    const API_URL = "https://api.freedompay.kg/get_status3.php";
    const signature = await getSignatureStatus(paymentId);

    const requestData = {
      pg_merchant_id: process.env.PAYBOX_MERCHANT_ID,
      pg_salt: "random string",
      pg_payment_id: paymentId,
      pg_sig: signature,
    };
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };

    const response = await axios.post(API_URL, qs.stringify(requestData), {
      headers,
    });

    if (response.status === 200) {
      const parser = new xml2js.Parser();
      parser.parseString(response.data, async (err, result) => {
        if (err) {
          console.error("Ошибка преобразования XML:", err);
          return res
            .status(500)
            .json({ error: "Ошибка преобразования XML", details: err });
        }

        const jsonResponse = result.response;
        await purchaseService(
          jsonResponse,
          userId,
          product,
          planPoint,
          quizPoint
        );
        console.log("purchaseService",  jsonResponse,
        userId,
        product,
        planPoint,
        quizPoint);

        // Обновляем данные пользователя перед отправкой
        const refreshedUser = await userModel
          .findById(userId)
          .populate("subscription");

        return res.status(200).json({
          message: "Оплата прошла успешно!",
          data: { jsonResponse, refreshedUser },
        });
      });
    } else {
      return res
        .status(500)
        .json({ error: "Ошибка при запросе", status: response.status });
    }
  } catch (error) {
    console.error("Ошибка:", error);
    return res
      .status(500)
      .json({ error: "Внутренняя ошибка сервера", details: error.message });
  }
};

// // Автоматическая акция
// async function applyDiscount(userId) {
//   const user = await userModel.findById(userId);

//   if (!user) throw new Error("Пользователь не найден");

//   if (user.points >= 50) {
//     console.log("Пользователь получает скидку на следующую покупку!");
//     user.points -= 50; // Списываем баллы за акцию
//     await user.save();
//   } else {
//     console.log("Недостаточно баллов для скидки.");
//   }
// }

// Пример вызовов
// (async () => {
//   await purchaseService("userId123", 25, "payment456"); // Покупка
//   await applyDiscount("userId123"); // Проверка скидки
// })();

async function getSignatureStatus(paymentId) {
  // console.log(amount, description, successUrl, paymentMethod);

  //  Исходные данные
  const request = {
    pg_merchant_id: process.env.PAYBOX_MERCHANT_ID.toString(),
    pg_payment_id: paymentId,
    pg_salt: "random string",
  };
  // console.log(request);

  /**
   * Рекурсивно преобразует объект в плоский массив параметров.
   * @param {Object} params - Исходный объект параметров.
   * @param {String} parentName - Родительский префикс для вложенных параметров.
   * @returns {Object} Плоский объект параметров.
   */
  function makeFlatParamsArray(params, parentName = "") {
    let flatParams = {};
    let index = 0;

    for (const [key, value] of Object.entries(params)) {
      index++;
      const paramName = `${parentName}${key}${String(index).padStart(3, "0")}`;

      if (typeof value === "object" && !Array.isArray(value)) {
        flatParams = {
          ...flatParams,
          ...makeFlatParamsArray(value, paramName),
        };
      } else {
        flatParams[paramName] = String(value);
      }
    }

    return flatParams;
  }

  // Превращаем объект запроса в плоский массив
  const flatParams = makeFlatParamsArray(request);

  // Сортируем параметры по ключам
  const sortedKeys = Object.keys(flatParams).sort();
  const sortedParams = sortedKeys.reduce((acc, key) => {
    acc[key] = flatParams[key];
    return acc;
  }, {});

  // Генерируем подпись
  const signatureArray = [
    "get_status3.php", // Имя скрипта
    ...Object.values(sortedParams),
    process.env.SECRET_KEY, // Секретный ключ
  ];

  const signature = crypto
    .createHash("md5")
    .update(signatureArray.join(";"))
    .digest("hex");

  return signature;
}

async function getSignature(
  orderId,
  amount,
  description,
  successUrl,
  paymentMethod
) {
  // console.log(amount, description, successUrl, paymentMethod);

  //  Исходные данные
  const request = {
    pg_order_id: orderId,
    pg_merchant_id: process.env.PAYBOX_MERCHANT_ID,
    pg_amount: amount,
    pg_description: description,
    pg_salt: "random string",
    pg_currency: "KGS",
    pg_payment_method: paymentMethod,
    pg_timeout_after_payment: "10",
    pg_success_url: successUrl,
    // pg_testing_mode: "1",
  };
  // console.log(request);

  /**
   * Рекурсивно преобразует объект в плоский массив параметров.
   * @param {Object} params - Исходный объект параметров.
   * @param {String} parentName - Родительский префикс для вложенных параметров.
   * @returns {Object} Плоский объект параметров.
   */
  function makeFlatParamsArray(params, parentName = "") {
    let flatParams = {};
    let index = 0;

    for (const [key, value] of Object.entries(params)) {
      index++;
      const paramName = `${parentName}${key}${String(index).padStart(3, "0")}`;

      if (typeof value === "object" && !Array.isArray(value)) {
        flatParams = {
          ...flatParams,
          ...makeFlatParamsArray(value, paramName),
        };
      } else {
        flatParams[paramName] = String(value);
      }
    }

    return flatParams;
  }

  // Превращаем объект запроса в плоский массив
  const flatParams = makeFlatParamsArray(request);

  // Сортируем параметры по ключам
  const sortedKeys = Object.keys(flatParams).sort();
  const sortedParams = sortedKeys.reduce((acc, key) => {
    acc[key] = flatParams[key];
    return acc;
  }, {});

  // Генерируем подпись
  const signatureArray = [
    "init_payment.php", // Имя скрипта
    ...Object.values(sortedParams),
    process.env.SECRET_KEY, // Секретный ключ
  ];

  const signature = crypto
    .createHash("md5")
    .update(signatureArray.join(";"))
    .digest("hex");

  signatureCode = signature;
  return signature.toString();
}
