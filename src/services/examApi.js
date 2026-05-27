export async function getExamPage(examId, page, signal) {
  const url = `/api/exam/${examId}/${page}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      let errorMsg = `Failed to fetch exam page: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const rawQuestions = data?.pageProps?.questions;

    if (!Array.isArray(rawQuestions)) {
      return [];
    }

    return rawQuestions.map(q => {
      const explanation = q.answer_description === '' ? null : (q.answer_description || null);
      const correctAnswer = q.answer || q.answer_ET || '';

      const totalPages = data?.pageProps?.totalPages || data?.pageProps?.totalQuestions || data?.pageProps?.total_questions || null;

      return {
        id: q.id,
        questionText: q.question_text || '',
        choices: q.choices || {},
        correctAnswer,
        explanation,
        discussion: q.discussion || [],
        communityAnswers: q.answers_community || [],
        questionImages: q.question_images || [],
        answerImages: q.answer_images || [],
        topic: q.topic || null,
        totalPages
      };
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching exam page:', error);
    }
    throw error;
  }
}
