import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_INSTRUCTION = `Bạn là một chuyên gia giải thích đề thi kỹ thuật. Nhiệm vụ của bạn là giải thích nguyên nhân đáp án đúng một cách siêu ngắn gọn và dễ hiểu. Quy tắc TỐI THƯỢNG: 1. Đi thẳng ngay vào vấn đề. TUYỆT ĐỐI KHÔNG chào hỏi, không dạ vâng, không dùng câu mào đầu (như 'Dưới đây là...'). 2. Độ dài tối đa 2 đến 3 câu. 3. Tuyệt đối không lan man. Chỉ tập trung giải thích từ khóa hoặc quy tắc cốt lõi giúp chọn được đáp án đó. 4. Trình bày trực diện, ngôn từ đơn giản.`;

export async function POST(request: NextRequest) {
  try {
    const { questionText, options, correctAnswer } = await request.json();

    if (!questionText || !correctAnswer) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu câu hỏi hoặc đáp án." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY chưa được cấu hình trên server." },
        { status: 500 }
      );
    }

    // Format options thành chuỗi dễ đọc cho AI
    let optionsText = "";
    if (options && typeof options === "object") {
      optionsText = Object.entries(options)
        .map(([key, value]) => `${key}. ${value}`)
        .join("\n");
    }

    const userPrompt = `Câu hỏi: ${questionText}
${optionsText ? `\nCác lựa chọn:\n${optionsText}` : ""}
\nĐáp án đúng: ${correctAnswer}
\nHãy giải thích tại sao đáp án đó đúng.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    });

    const result = await model.generateContent(userPrompt);
    const explanation = result.response.text();

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error("[API /explain] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
