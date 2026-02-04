import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WaveDivider } from './WaveDivider';

const faqs = [
  {
    question: "Who is this workshop for?",
    answer: "This workshop is designed for parents of school-going children who are interested in future-ready skills and are actively involved in their children's education. No technical background is required."
  },
  {
    question: "Is this a coding or tuition program?",
    answer: "No. The approach focuses on thinking skills, problem-solving, and early exposure to technology and AI concepts. It is not exam-oriented and does not function as tuition."
  },
  {
    question: "How are children taught in the program?",
    answer: "Learning is delivered through structured modules designed for different age groups. Each module combines guided activities, discussion, and exploration rather than passive screen use. The emphasis is on understanding concepts, asking questions, and building confidence over time."
  },
  {
    question: "What teaching methods are used?",
    answer: "Teaching is guided and facilitator-led, with small groups where appropriate. Lessons are designed to be interactive, age-appropriate, and paced to match children's developmental stages. There is a strong focus on explanation, reflection, and practical thinking rather than rote instruction."
  },
  {
    question: "How does AI feature in the learning?",
    answer: "AI is introduced conceptually and practically in ways children can understand. The focus is on how AI works, where it is used, and how to think critically about it, not on advanced technical use."
  },
  {
    question: "Does my child need prior experience with technology?",
    answer: "No prior experience is required. The program is designed to meet children at their current level and guide them progressively."
  },
  {
    question: "What happens after the workshop?",
    answer: "After the workshop, parents who are interested can choose to explore the learning program further. Participation beyond the workshop is optional."
  },
  {
    question: "What about exam pressure and competition?",
    answer: "Learning is introduced as a process, not a performance. The program is designed to build confidence and curiosity without creating anxiety or fostering unhealthy comparison with peers."
  },
  {
    question: "How much time does the program require from parents?",
    answer: "Parents are supported throughout, but the program is designed to be manageable. Most parents report spending just a few hours per week on guidance and engagement. We provide resources to make this easier."
  },
  {
    question: "Can I speak to other parents before deciding?",
    answer: "Yes. We encourage you to connect with other parents in our community. The workshop is also an opportunity to ask real parents about their experience."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const FAQSection = () => {
  return (
    <section className="relative section-padding bg-background pt-24 md:pt-32">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-soft-navy mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Clear answers to help you understand the approach and what to expect.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`faq-${index}`}
                  className="border border-border rounded-lg px-6 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <AccordionTrigger className="text-lg font-semibold text-soft-navy hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground">
            Still have questions? Reach out to us on WhatsApp for a personal conversation.
          </p>
        </motion.div>
      </div>

      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--muted))" />
    </section>
  );
};
