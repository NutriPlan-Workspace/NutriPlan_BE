import mongoose from 'mongoose';

import connectDB from '@/configs/database.config';
import { ArticleModel } from '@/models/article.model';
import { ArticleService } from '@/services/article.service';

async function main() {
  await connectDB();

  const force = process.env.FORCE === 'true' || process.env.FORCE === '1';
  const existingCount = await ArticleModel.countDocuments();

  if (existingCount > 0 && !force) {
    // eslint-disable-next-line no-console
    console.log(
      `Skip seeding: already has ${existingCount} articles. Set FORCE=true to re-seed.`,
    );
    return;
  }

  if (force && existingCount > 0) {
    await ArticleModel.deleteMany({});
  }

  const service = new ArticleService();

  const seed = [
    {
      title: 'Bắt đầu meal plan trong 10 phút: 5 bước đơn giản',
      excerpt:
        'Nếu bạn từng bỏ cuộc vì meal planning quá phức tạp, bài viết này giúp bạn bắt đầu nhanh, nhẹ và duy trì bền vững.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80',
      content: [
        'Meal planning không cần cầu kỳ. Mục tiêu là giảm quyết định mỗi ngày và ăn đủ chất.',
        '',
        '1) Chọn mục tiêu (giảm cân / giữ cân / tăng cơ).',
        '2) Chọn số bữa/ngày (2–4 bữa).',
        '3) Chọn 6–9 món “cốt lõi” bạn ăn được nhiều lần.',
        '4) Chốt danh sách mua sắm theo món.',
        '5) Dự phòng 1–2 bữa linh hoạt (swap) để không bị chán.',
        '',
        'Mẹo: đặt ưu tiên cho protein trước, sau đó mới đến carb và fat để dễ kiểm soát no lâu.',
      ].join('\n'),
      isPublished: true,
    },
    {
      title: 'Protein là gì? Cách ăn đủ protein theo cân nặng',
      excerpt:
        'Protein giúp no lâu, giữ cơ, và hỗ trợ chuyển hoá. Nhưng ăn bao nhiêu là đủ? Và chia thế nào cho dễ?',
      coverImageUrl:
        'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1400&q=80',
      content: [
        'Khuyến nghị phổ biến:',
        '- Người ít vận động: ~0.8 g/kg/ngày',
        '- Người tập luyện: ~1.2–2.0 g/kg/ngày (tuỳ mục tiêu)',
        '',
        'Ví dụ: 60kg, mục tiêu duy trì & tập nhẹ → 1.2 g/kg ≈ 72g protein/ngày.',
        '',
        'Cách chia đơn giản:',
        '- 3 bữa/ngày → mỗi bữa ~20–30g',
        '- Thêm snack → mỗi snack ~10–20g',
        '',
        'Nguồn protein dễ áp dụng: ức gà, trứng, cá, đậu hũ, sữa chua Hy Lạp, đậu/đỗ.',
      ].join('\n'),
      isPublished: true,
    },
    {
      title:
        'Carb tốt vs carb xấu: chọn thế nào để không tăng đường huyết đột ngột',
      excerpt:
        'Carb không phải “kẻ xấu”. Quan trọng là loại carb, chất xơ, và cách kết hợp trong bữa ăn.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
      content: [
        '3 tiêu chí chọn carb “tốt”:',
        '1) Giàu chất xơ (gạo lứt, khoai lang, yến mạch, các loại đậu).',
        '2) Ít chế biến (ưu tiên nguyên hạt).',
        '3) Ăn cùng protein + chất béo tốt để giảm tốc độ hấp thu.',
        '',
        'Một mẹo rất dễ: mỗi bữa có carb → thêm rau + protein trước, rồi mới ăn carb.',
      ].join('\n'),
      isPublished: true,
    },
  ];

  for (const article of seed) {
    await service.create(article);
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${seed.length} articles successfully.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed articles failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
