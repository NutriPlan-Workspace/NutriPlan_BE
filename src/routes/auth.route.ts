import { Router } from 'express';
import validateAuth from 'middlewares/validateAuth.middleware';

import { ROUTES } from '@/constants/routes';
import userController from '@/controllers/auth.controller';
import validateSchema from '@/middlewares/validateSchema.middleware';
import { createUserDto } from '@/schemas/user.schema';
import { loginSchemaValidate } from '@/validations/auth.validates';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 * */
router.post(
  ROUTES.AUTH.LOGIN,
  validateAuth(loginSchemaValidate),
  userController.login,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 * */
router.post(ROUTES.AUTH.LOGOUT, userController.logout);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user in the system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - password
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Tobitobi1123123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: minhh13@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: P@ssw0rd123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "67c7b58b680f6b73e12f5bba"
 *                     fullname:
 *                       type: string
 *                       example: Tobitobi1123123
 *                     email:
 *                       type: string
 *                       example: minhh13@gmail.com
 *                     role:
 *                       type: string
 *                       example: user
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-03-05T02:23:07.746Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-03-05T02:23:07.746Z"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid request parameters
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: email
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - Email is already in use
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: string
 *                   example: []
 */

router.post(
  ROUTES.AUTH.REGISTER,
  validateSchema(createUserDto),
  userController.register,
);

export default router;
