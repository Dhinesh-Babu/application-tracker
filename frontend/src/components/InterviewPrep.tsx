// frontend/src/components/InterviewPrep.tsx - Modern Mantine UI

import { useState, useEffect } from 'react'
import { 
  Stack, 
  Group, 
  Button, 
  Text, 
  Card, 
  Badge, 
  Progress, 
  Textarea,
  ActionIcon,
  Box,
  Alert,
  Title,
  SimpleGrid,
  Divider,
  Container,
  LoadingOverlay,
  ScrollArea
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconX, 
  IconTarget, 
  IconBrain,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconBulb,
  IconTrophy,
  IconRefresh,
  IconSparkles,
  IconRocket
} from '@tabler/icons-react'

interface InterviewQuestion {
  question: string
  category: string
  difficulty: string
}

interface AnswerFeedback {
  question: string
  user_answer: string
  feedback: string
  score: number
  improvement_suggestions: string[]
  ideal_points: string[]
}

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

export default function InterviewPrep({ jobId, jobTitle, company, onClose }: Props) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [feedback, setFeedback] = useState<{ [key: number]: AnswerFeedback }>({})
  const [sessionId, setSessionId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<"loading" | "questions" | "practice" | "review">("loading")

  useEffect(() => {
    generateQuestions()
  }, [])

  const generateQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      })
      
      const data = await response.json()
      setQuestions(data.questions)
      setPhase("questions")
      
      notifications.show({
        title: 'Questions Generated! 🎯',
        message: `${data.questions.length} personalized questions ready`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (error) {
      notifications.show({
        title: 'Generation Failed',
        message: 'Please make sure your API key is configured',
        color: 'red',
      })
      console.error("Failed to generate questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const startPractice = () => {
    setPhase("practice")
    setCurrentQuestionIndex(0)
    setSessionId(Date.now().toString())
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return

    setLoading(true)
    try {
      const feedbackResponse = await fetch('http://localhost:8000/interview/get-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question: questions[currentQuestionIndex].question,
          answer: currentAnswer,
          question_category: questions[currentQuestionIndex].category
        })
      })

      const feedbackData = await feedbackResponse.json()
      
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }))
      setFeedback(prev => ({ ...prev, [currentQuestionIndex]: feedbackData }))
      setCurrentAnswer("")

      notifications.show({
        title: 'Answer Submitted! ✅',
        message: `Score: ${feedbackData.score}/10`,
        color: feedbackData.score >= 7 ? 'green' : feedbackData.score >= 5 ? 'yellow' : 'red',
      })

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        setPhase("review")
      }
    } catch (error) {
      notifications.show({
        title: 'Feedback Failed',
        message: 'Please try again',
        color: 'red',
      })
      console.error("Failed to get feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "blue"
      case "behavioral": return "green" 
      case "company-specific": return "orange"
      default: return "gray"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "green"
      case "medium": return "yellow"
      case "hard": return "red"
      default: return "gray"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "green"
    if (score >= 6) return "yellow"
    return "red"
  }

  if (loading && phase === "loading") {
    return (
      <Container size="md" py="xl">
        <Card withBorder shadow="md" p="xl" style={{ position: 'relative', minHeight: 300 }}>
          <LoadingOverlay visible />
          <Stack align="center" gap="md">
            <IconBrain size={64} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">Generating Questions...</Title>
            <Text ta="center" c="dimmed">
              Analyzing <strong>{jobTitle}</strong> at <strong>{company}</strong> to create personalized interview questions
            </Text>
          </Stack>
        </Card>
      </Container>
    )
  }

  if (phase === "questions") {
    return (
      <Container size="lg" py="xl">
        <Card withBorder shadow="md" p="xl">
          <Group justify="space-between" mb="xl">
            <Stack gap="xs">
              <Title order={2}>🎯 Questions Ready!</Title>
              <Text c="dimmed">
                <strong>{jobTitle}</strong> at <strong>{company}</strong>
              </Text>
            </Stack>
            <ActionIcon variant="light" color="gray" onClick={onClose}>
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <Alert icon={<IconSparkles size={16} />} color="blue" variant="light" mb="xl">
            Generated <strong>{questions.length} personalized questions</strong> based on the job description
          </Alert>

          <ScrollArea h={400} mb="xl">
            <Stack gap="md">
              {questions.map((q, index) => (
                <Card key={index} withBorder p="md">
                  <Group mb="sm" gap="xs">
                    <Badge size="sm" color="gray">Q{index + 1}</Badge>
                    <Badge size="sm" color={getCategoryColor(q.category)}>
                      {q.category.replace('-', ' ')}
                    </Badge>
                    <Badge size="sm" color={getDifficultyColor(q.difficulty)}>
                      {q.difficulty}
                    </Badge>
                  </Group>
                  <Text>{q.question}</Text>
                </Card>
              ))}
            </Stack>
          </ScrollArea>

          <Button 
            onClick={startPractice} 
            size="lg"
            fullWidth
            leftSection={<IconRocket size={20} />}
            gradient={{ from: 'blue', to: 'purple', deg: 45 }}
          >
            Start Practice Session
          </Button>
        </Card>
      </Container>
    )
  }

  if (phase === "practice") {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100
    
    return (
      <Container size="md" py="xl">
        <Card withBorder shadow="md" p="xl">
          <Group justify="space-between" mb="xl">
            <Stack gap="xs">
              <Title order={2}>Question {currentQuestionIndex + 1} of {questions.length}</Title>
              <Text c="dimmed">
                <strong>{jobTitle}</strong> at <strong>{company}</strong>
              </Text>
            </Stack>
            <ActionIcon variant="light" color="gray" onClick={onClose}>
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <Progress value={progress} size="lg" mb="xl" />

          <Card withBorder p="xl" mb="xl">
            <Group mb="md" gap="xs">
              <Badge color={getCategoryColor(currentQuestion.category)}>
                {currentQuestion.category.replace('-', ' ')}
              </Badge>
              <Badge color={getDifficultyColor(currentQuestion.difficulty)}>
                {currentQuestion.difficulty}
              </Badge>
            </Group>
            
            <Text size="lg" fw={500} mb="xl">
              {currentQuestion.question}
            </Text>

            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Take your time to craft a thoughtful response..."
              minRows={6}
              maxRows={10}
              mb="md"
              styles={{
                input: { fontSize: '16px', lineHeight: 1.6 }
              }}
            />
            
            <Text size="xs" c="dimmed" ta="right">
              {currentAnswer.length} characters
            </Text>
          </Card>

          <Group justify="space-between">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconChevronLeft size={16} />}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <Button 
              onClick={submitAnswer}
              disabled={!currentAnswer.trim()}
              loading={loading}
              leftSection={<IconCheck size={16} />}
              color="green"
            >
              {loading ? "Getting Feedback..." : "Submit Answer"}
            </Button>
          </Group>

          {/* Question Navigator */}
          <Divider my="xl" />
          <Group justify="center" gap="xs">
            {questions.map((_, index) => (
              <ActionIcon
                key={index}
                variant={answers[index] ? "filled" : index === currentQuestionIndex ? "light" : "subtle"}
                color={answers[index] ? "green" : index === currentQuestionIndex ? "blue" : "gray"}
                onClick={() => setCurrentQuestionIndex(index)}
                size="lg"
              >
                {index + 1}
              </ActionIcon>
            ))}
          </Group>
        </Card>
      </Container>
    )
  }

  if (phase === "review") {
    const completedQuestions = Object.keys(feedback).length
    const averageScore = completedQuestions > 0 
      ? Object.values(feedback).reduce((sum, f) => sum + f.score, 0) / completedQuestions 
      : 0

    return (
      <Container size="lg" py="xl">
        <Card withBorder shadow="md" p="xl" mb="xl">
          <Group justify="space-between" mb="xl">
            <Stack gap="xs">
              <Title order={2}>🎉 Practice Complete!</Title>
              <Text c="dimmed">
                <strong>{jobTitle}</strong> at <strong>{company}</strong>
              </Text>
            </Stack>
            <ActionIcon variant="light" color="gray" onClick={onClose}>
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <SimpleGrid cols={2} mb="xl">
            <Card withBorder p="md" ta="center">
              <Text size="3xl" fw={800} c={getScoreColor(averageScore)}>
                {averageScore.toFixed(1)}
              </Text>
              <Text size="sm" c="dimmed">Average Score</Text>
            </Card>
            <Card withBorder p="md" ta="center">
              <Text size="3xl" fw={800} c="blue">
                {completedQuestions}
              </Text>
              <Text size="sm" c="dimmed">Questions Answered</Text>
            </Card>
          </SimpleGrid>

          <Group justify="center" gap="md">
            <Button 
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
              variant="light"
            >
              Practice Again
            </Button>
            <Button 
              leftSection={<IconTarget size={16} />}
              onClick={onClose}
              color="gray"
            >
              Back to Jobs
            </Button>
          </Group>
        </Card>

        <ScrollArea h={600}>
          <Stack gap="xl">
            {questions.map((question, index) => {
              const questionFeedback = feedback[index]
              if (!questionFeedback) return null

              return (
                <Card key={index} withBorder p="xl">
                  <Group mb="md" gap="xs">
                    <Badge color="gray">Q{index + 1}</Badge>
                    <Badge color={getCategoryColor(question.category)}>
                      {question.category.replace('-', ' ')}
                    </Badge>
                    <Badge color={getScoreColor(questionFeedback.score)}>
                      {questionFeedback.score}/10
                    </Badge>
                  </Group>

                  <Text fw={500} mb="md">{question.question}</Text>

                  <Card withBorder p="md" mb="md">
                    <Text size="sm" fw={500} mb="xs">Your Answer:</Text>
                    <Text size="sm" c="dimmed">{questionFeedback.user_answer}</Text>
                  </Card>

                  <Alert icon={<IconBulb size={16} />} color="blue" variant="light" mb="md">
                    <Text size="sm">{questionFeedback.feedback}</Text>
                  </Alert>

                  <SimpleGrid cols={2} spacing="md">
                    <Card withBorder p="md">
                      <Text size="sm" fw={500} mb="xs" c="red">🔧 Improvements:</Text>
                      <Stack gap={4}>
                        {questionFeedback.improvement_suggestions.map((suggestion, i) => (
                          <Text key={i} size="xs" c="dimmed">• {suggestion}</Text>
                        ))}
                      </Stack>
                    </Card>
                    
                    <Card withBorder p="md">
                      <Text size="sm" fw={500} mb="xs" c="green">✅ Key Points:</Text>
                      <Stack gap={4}>
                        {questionFeedback.ideal_points.map((point, i) => (
                          <Text key={i} size="xs" c="dimmed">• {point}</Text>
                        ))}
                      </Stack>
                    </Card>
                  </SimpleGrid>
                </Card>
              )
            })}
          </Stack>
        </ScrollArea>
      </Container>
    )
  }

  return null
}