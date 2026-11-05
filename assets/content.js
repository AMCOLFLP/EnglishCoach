/* Original learning material written for this rebuilt practice site.
 * Examples describe fictional learning situations, not real learner records.
 * Scenario opening is a greeting/context only; turns[0].question begins the task.
 * Maritime activities practise English and are not operational certification.
 */
(function () {
  'use strict';

  const lessons = [
    {
      id: 'introductions', title: 'Meet someone new', category: 'everyday', level: 'A1', minutes: 8,
      description: 'Introduce yourself to a classmate and keep a short conversation going.',
      objective: 'Give your name, hometown, course, and one interest in four or five clear sentences.',
      vocabulary: [
        { word: 'name', meaning: 'What a person is called.', example: 'My name is Mina.', thai: 'ชื่อ' },
        { word: 'hometown', meaning: 'The town or city you come from.', example: 'My hometown is Chiang Mai.', thai: 'บ้านเกิด' },
        { word: 'study', meaning: 'Learn about a subject.', example: 'I study logistics.', thai: 'เรียน / ศึกษา' },
        { word: 'classmate', meaning: 'Someone in the same class as you.', example: 'Ben is my classmate.', thai: 'เพื่อนร่วมชั้น' },
        { word: 'hobby', meaning: 'An activity you enjoy in your free time.', example: 'My hobby is drawing.', thai: 'งานอดิเรก' },
        { word: 'meet', meaning: 'See and speak to someone for the first time.', example: 'Nice to meet you.', thai: 'พบ / รู้จัก' }
      ],
      dialogue: [
        { speaker: 'Mina', text: 'Hi. My name is Mina. What is your name?' },
        { speaker: 'Ben', text: 'I am Ben. Nice to meet you.' },
        { speaker: 'Mina', text: 'Nice to meet you, too. Where are you from?' },
        { speaker: 'Ben', text: 'I am from Chonburi. I study logistics. What about you?' },
        { speaker: 'Mina', text: 'I am from Chiang Mai. I study English. I like drawing.' },
        { speaker: 'Ben', text: 'That sounds interesting. I like playing football.' }
      ],
      tips: ['Use I am for your name or identity: I am Ben.', 'Use I study for your course: I study logistics.', 'Ask What about you? to invite the other person to speak.', 'Pause after each idea. You do not need to say everything in one breath.'],
      prompt: 'You meet a new classmate. Introduce yourself with your name, hometown, course, and a hobby. End with a friendly question.',
      starter: 'Hello. My name is… I am from…',
      modelAnswer: 'Hello. My name is Mina. I am from Chiang Mai. I study logistics. My hobby is drawing. What about you?',
      targets: ['name', 'from', 'study', 'hobby'],
      tasks: ['Say a four-sentence introduction using your own details.', 'Ask a partner for their name and hometown.', 'Introduce yourself again without looking at the model.']
    },
    {
      id: 'daily-routines', title: 'Talk about your day', category: 'everyday', level: 'A2', minutes: 10,
      description: 'Describe a college or workday using times, frequency words, and sequence.',
      objective: 'Explain at least four routine activities in a logical order.',
      vocabulary: [
        { word: 'routine', meaning: 'Things you regularly do.', example: 'My morning routine starts at six.', thai: 'กิจวัตร' },
        { word: 'usually', meaning: 'On most occasions.', example: 'I usually take the bus.', thai: 'โดยปกติ' },
        { word: 'shift', meaning: 'A scheduled period of work.', example: 'My shift starts at eight.', thai: 'กะทำงาน' },
        { word: 'before', meaning: 'Earlier than something else.', example: 'I eat breakfast before class.', thai: 'ก่อน' },
        { word: 'after', meaning: 'Later than something else.', example: 'I review my notes after dinner.', thai: 'หลัง / หลังจาก' },
        { word: 'finish', meaning: 'Complete or come to the end of something.', example: 'I finish class at four.', thai: 'เสร็จ / เลิก' }
      ],
      dialogue: [
        { speaker: 'Ari', text: 'What time do you usually get up?' },
        { speaker: 'Ben', text: 'I usually get up at six. I have breakfast before college.' },
        { speaker: 'Ari', text: 'How do you get there?' },
        { speaker: 'Ben', text: 'I take the bus. My first class starts at eight.' },
        { speaker: 'Ari', text: 'What do you do after class?' },
        { speaker: 'Ben', text: 'I sometimes play football. After dinner, I review my notes.' }
      ],
      tips: ['Use the present simple for routines: I take the bus.', 'Usually normally goes before the main verb: I usually study after dinner.', 'With he or she, add the appropriate ending: She starts at eight.', 'Use at for clock times: at six, at half past eight.'],
      prompt: 'Describe a normal weekday. Include the time you start, two activities, and something you do after class or work.',
      starter: 'I usually get up at… Before… After…',
      modelAnswer: 'I usually get up at six. I eat breakfast before college. My first class starts at eight. I finish at four. After dinner, I review my notes for twenty minutes.',
      targets: ['usually', 'before', 'starts', 'finish', 'after'],
      tasks: ['Write four activities in the order you do them.', 'Explain your routine aloud with two clock times.', 'Ask a partner about their routine and describe one difference.']
    },
    {
      id: 'making-plans', title: 'Make a plan together', category: 'everyday', level: 'B1', minutes: 12,
      description: 'Suggest a plan, explain a preference, and agree on a practical alternative.',
      objective: 'Negotiate a time and place, give a reason, and confirm the final arrangement.',
      vocabulary: [
        { word: 'available', meaning: 'Free to take part at a particular time.', example: 'I am available on Saturday morning.', thai: 'ว่าง / พร้อม' },
        { word: 'prefer', meaning: 'Like one option more than another.', example: 'I prefer the library because it is quiet.', thai: 'ชอบมากกว่า' },
        { word: 'suggest', meaning: 'Offer an idea for someone to consider.', example: 'I suggest meeting at ten.', thai: 'เสนอแนะ' },
        { word: 'instead', meaning: 'In place of another choice.', example: 'Could we meet on Sunday instead?', thai: 'แทน' },
        { word: 'agree', meaning: 'Have the same opinion or accept a plan.', example: 'I agree. Ten o’clock works for me.', thai: 'เห็นด้วย / ตกลง' },
        { word: 'confirm', meaning: 'Make an arrangement or detail clear and definite.', example: 'Let me confirm the time and place.', thai: 'ยืนยัน' }
      ],
      dialogue: [
        { speaker: 'Nina', text: 'Would you like to prepare our presentation on Friday afternoon?' },
        { speaker: 'Kai', text: 'I have work on Friday. Could we meet on Saturday instead?' },
        { speaker: 'Nina', text: 'Yes. I am available in the morning. How about ten o’clock?' },
        { speaker: 'Kai', text: 'That works for me. I prefer the library because it is quiet.' },
        { speaker: 'Nina', text: 'I agree. Let’s bring our notes and choose the main points first.' },
        { speaker: 'Kai', text: 'So, Saturday at ten in the library. I will see you there.' }
      ],
      tips: ['Use Could we…? or How about…? to make a suggestion.', 'Give a short reason with because.', 'When declining a time, offer an alternative if you can.', 'Repeat the agreed time, place, and purpose before ending the conversation.'],
      prompt: 'A classmate wants to practise a presentation on Friday, but you are busy. Suggest another time and a place, explain your choice, and confirm what you will do.',
      starter: 'I am not available on Friday. Could we… instead?',
      modelAnswer: 'I am not available on Friday. Could we meet on Saturday instead? I prefer the library because it is quiet. Let’s meet at ten and practise our presentation. To confirm, that is Saturday at ten in the library.',
      targets: ['available', 'instead', 'prefer', 'because', 'confirm'],
      tasks: ['Offer a new time when a partner rejects your first suggestion.', 'Compare two meeting places and explain your preference.', 'Finish by confirming the time, place, and shared task.']
    },
    {
      id: 'ordering-food', title: 'Order a meal politely', category: 'everyday', level: 'A2', minutes: 10,
      description: 'Order a dish and a drink, ask to take them away, and check the total.',
      objective: 'Make a polite food order, state where you will eat, and confirm the price before paying.',
      vocabulary: [
        { word: 'menu', meaning: 'A list of the food and drinks you can order.', example: 'Could I see the menu, please?', thai: 'รายการอาหาร' },
        { word: 'order', meaning: 'Ask for food or a drink to be prepared or served.', example: 'I would like to order a rice bowl.', thai: 'สั่งอาหารหรือเครื่องดื่ม' },
        { word: 'still water', meaning: 'Drinking water without bubbles from added gas.', example: 'Could I have a bottle of still water?', thai: 'น้ำดื่มไม่อัดลม' },
        { word: 'takeaway', meaning: 'Food prepared for you to take somewhere else to eat.', example: 'Is this order for takeaway?', thai: 'อาหารที่สั่งกลับบ้าน' },
        { word: 'total', meaning: 'The full amount after the prices are added together.', example: 'Is the total one hundred baht?', thai: 'ยอดรวม' },
        { word: 'receipt', meaning: 'A record showing what you bought and paid for.', example: 'Could I have a receipt, please?', thai: 'ใบเสร็จรับเงิน' }
      ],
      dialogue: [
        { speaker: 'Cashier', text: 'Welcome. Would you like to see the menu?' },
        { speaker: 'Customer', text: 'Yes, please. How much is the vegetable rice bowl?' },
        { speaker: 'Cashier', text: 'It is eighty baht. A bottle of still water is twenty baht.' },
        { speaker: 'Customer', text: 'I would like one vegetable rice bowl and a bottle of still water, please.' },
        { speaker: 'Cashier', text: 'Would you like to eat here or take it away?' },
        { speaker: 'Customer', text: 'To take away, please. Is the total one hundred baht?' },
        { speaker: 'Cashier', text: 'Yes, that is one hundred baht.' },
        { speaker: 'Customer', text: 'Thank you. Could I have a receipt, please?' }
      ],
      tips: ['Use I would like… or Could I have…? for a polite order.', 'Give a clear quantity: one rice bowl or a bottle of water.', 'To take away and to go both mean that you will take the order with you.', 'Repeat the important items and check the total before paying.'],
      prompt: 'At this fictional café, a vegetable rice bowl costs eighty baht and a bottle of still water costs twenty baht. Order one of each to take away. Confirm the total and ask for a receipt.',
      starter: 'Hello. I would like one… and a bottle of…',
      modelAnswer: 'Hello. I would like one vegetable rice bowl and a bottle of still water to take away, please. Is the total one hundred baht? Could I have a receipt, please?',
      targets: ['like', 'rice', 'water', 'away', 'total', 'receipt'],
      tasks: ['Order one dish and one drink using I would like… or Could I have…?', 'Ask to take the order away and confirm the total from the practice menu.', 'Ask a partner to repeat your order, correct one mistaken item politely, and request a receipt.']
    },
    {
      id: 'asking-directions', title: 'Find your way', category: 'travel', level: 'A1', minutes: 8,
      description: 'Ask for a place and follow a short set of directions.',
      objective: 'Ask where a place is and repeat two directions to check understanding.',
      vocabulary: [
        { word: 'straight ahead', meaning: 'Continue forward without turning.', example: 'Go straight ahead for two minutes.', thai: 'ตรงไปข้างหน้า' },
        { word: 'left', meaning: 'The direction on your left-hand side.', example: 'Turn left at the bank.', thai: 'ซ้าย' },
        { word: 'right', meaning: 'The direction on your right-hand side.', example: 'The station is on your right.', thai: 'ขวา' },
        { word: 'opposite', meaning: 'Facing something from the other side.', example: 'The bank is opposite the station.', thai: 'ตรงข้าม' },
        { word: 'near', meaning: 'Not far away.', example: 'The bus stop is near the café.', thai: 'ใกล้' },
        { word: 'corner', meaning: 'The place where two streets meet.', example: 'Turn right at the corner.', thai: 'หัวมุม / มุมถนน' }
      ],
      dialogue: [
        { speaker: 'Visitor', text: 'Excuse me. Where is the train station?' },
        { speaker: 'Local', text: 'Go straight ahead. Then turn left at the bank.' },
        { speaker: 'Visitor', text: 'Straight ahead, then left at the bank?' },
        { speaker: 'Local', text: 'Yes. The station is on your right, opposite the café.' },
        { speaker: 'Visitor', text: 'Is it far from here?' },
        { speaker: 'Local', text: 'No. It is about five minutes on foot.' }
      ],
      tips: ['Start with Excuse me when asking a stranger for help.', 'Say on your left or on your right for a location.', 'Use Then to make the order of directions clear.', 'Repeat an important direction instead of guessing.'],
      prompt: 'Ask how to get to the train station. Then repeat these directions to check them: go straight ahead, turn left at the bank, and find the station on your right.',
      starter: 'Excuse me. Where is…? So, I go…',
      modelAnswer: 'Excuse me. Where is the train station? So, I go straight ahead and turn left at the bank. The station is on my right. Is that correct?',
      targets: ['excuse', 'station', 'straight', 'left', 'right'],
      tasks: ['Ask for directions to a familiar place.', 'Give a partner two directions using Then.', 'Repeat your partner’s directions and ask Is that correct?']
    },
    {
      id: 'hotel-check-in', title: 'Check in with confidence', category: 'travel', level: 'A2', minutes: 10,
      description: 'Give booking details and make a polite request at a hotel.',
      objective: 'State your reservation details, spell your surname, and ask one useful question.',
      vocabulary: [
        { word: 'reservation', meaning: 'An arrangement to keep a room or place for you.', example: 'I have a reservation for two nights.', thai: 'การจอง' },
        { word: 'surname', meaning: 'Your family name.', example: 'My surname is Lee.', thai: 'นามสกุล' },
        { word: 'check in', meaning: 'Register your arrival at a hotel or airport.', example: 'I would like to check in, please.', thai: 'ลงทะเบียนเข้าพัก / เช็กอิน' },
        { word: 'key card', meaning: 'A card used to open a hotel room door.', example: 'Here is your key card.', thai: 'บัตรกุญแจห้องพัก' },
        { word: 'receipt', meaning: 'A record showing that you have paid.', example: 'Could I have a receipt, please?', thai: 'ใบเสร็จรับเงิน' },
        { word: 'check-out time', meaning: 'The time by which a guest should leave the room.', example: 'What is the check-out time?', thai: 'เวลาเช็กเอาต์' }
      ],
      dialogue: [
        { speaker: 'Guest', text: 'Good evening. I have a reservation under the name Lee.' },
        { speaker: 'Receptionist', text: 'Welcome. Could you spell your surname, please?' },
        { speaker: 'Guest', text: 'Certainly. L–E–E. I booked a room for two nights.' },
        { speaker: 'Receptionist', text: 'Thank you. Your room is ready. Here is your key card.' },
        { speaker: 'Guest', text: 'Could you tell me the check-out time, please?' },
        { speaker: 'Receptionist', text: 'For this booking, check-out is at eleven in the morning.' }
      ],
      tips: ['Use I have a reservation under the name… for an existing booking.', 'Say for two nights to give the length of your stay.', 'Use Could I have…? for a polite request.', 'Ask about the actual booking; times and services vary between hotels.'],
      prompt: 'You have a room booked for two nights. Greet the receptionist, give and spell your surname, and ask about the check-out time.',
      starter: 'Good evening. I have a reservation under the name…',
      modelAnswer: 'Good evening. I have a reservation under the name Lee. That is L–E–E. I booked a room for two nights. Could you tell me the check-out time, please?',
      targets: ['reservation', 'name', 'two', 'nights', 'please'],
      tasks: ['Practise spelling your surname clearly.', 'Role-play giving your name and number of nights.', 'Ask for a receipt or information about the check-out time.']
    },
    {
      id: 'travel-problem', title: 'Explain a travel problem', category: 'travel', level: 'B1', minutes: 12,
      description: 'Explain what happened during a journey and ask about practical options.',
      objective: 'State a travel problem, explain its effect, and request an alternative without assuming the outcome.',
      vocabulary: [
        { word: 'delayed', meaning: 'Happening later than planned.', example: 'My first flight was delayed.', thai: 'ล่าช้า' },
        { word: 'cancelled', meaning: 'No longer going to take place.', example: 'The ten o’clock train was cancelled.', thai: 'ถูกยกเลิก' },
        { word: 'connection', meaning: 'A later flight, train, or bus that continues your journey.', example: 'I missed my connection.', thai: 'เที่ยวเดินทางต่อ' },
        { word: 'alternative', meaning: 'Another available choice.', example: 'Is there an alternative route?', thai: 'ทางเลือกอื่น' },
        { word: 'refund', meaning: 'Money returned after a purchase in qualifying circumstances.', example: 'Could you explain whether a refund is available?', thai: 'การคืนเงิน' },
        { word: 'arrive', meaning: 'Reach a place.', example: 'I need to arrive before six.', thai: 'มาถึง' }
      ],
      dialogue: [
        { speaker: 'Traveller', text: 'Excuse me. My first flight was delayed, so I missed my connection.' },
        { speaker: 'Agent', text: 'I understand. What is your final destination?' },
        { speaker: 'Traveller', text: 'Bangkok. Could you check what alternatives are available?' },
        { speaker: 'Agent', text: 'Let me check. What time do you need to arrive?' },
        { speaker: 'Traveller', text: 'Before six this evening, if possible. Are there any additional charges?' },
        { speaker: 'Agent', text: 'I will check the options and explain the conditions before you decide.' }
      ],
      tips: ['Use the past simple for completed events: I missed my connection.', 'Use so to connect a cause and its result.', 'Ask about availability, arrival time, and any additional cost.', 'Only state details you know. Ask staff to clarify rules and conditions.'],
      prompt: 'Your first flight was delayed and you missed your connection to Bangkok. Explain the problem, say you hope to arrive before six, and ask about another option and any extra cost.',
      starter: 'My first flight was delayed, so… Could you…?',
      modelAnswer: 'My first flight was delayed, so I missed my connection to Bangkok. I need to arrive before six this evening, if possible. Could you check an alternative flight? Please also tell me about any additional charges.',
      targets: ['delayed', 'missed', 'connection', 'arrive', 'alternative'],
      tasks: ['Explain a travel problem in two sentences: event and effect.', 'Ask about two details before choosing an alternative.', 'Repeat the new arrangement to check that you understood it.']
    },
    {
      id: 'workplace-help', title: 'Ask for help at work', category: 'work', level: 'A1', minutes: 8,
      description: 'Ask a colleague to repeat, slow down, or show you a task.',
      objective: 'Use three polite clarification requests and check one instruction.',
      vocabulary: [
        { word: 'help', meaning: 'Support someone with a task or problem.', example: 'Could you help me, please?', thai: 'ช่วย / ความช่วยเหลือ' },
        { word: 'repeat', meaning: 'Say or do something again.', example: 'Please repeat the instruction.', thai: 'พูดซ้ำ / ทำซ้ำ' },
        { word: 'slowly', meaning: 'At a lower speed.', example: 'Could you speak slowly, please?', thai: 'ช้า ๆ' },
        { word: 'show', meaning: 'Let someone see how something is done.', example: 'Could you show me where to write the date?', thai: 'แสดง / สาธิต' },
        { word: 'instruction', meaning: 'Information telling you what to do.', example: 'I do not understand this instruction.', thai: 'คำสั่ง / คำแนะนำ' },
        { word: 'check', meaning: 'Look at something to make sure it is correct.', example: 'Please check the number.', thai: 'ตรวจสอบ' }
      ],
      dialogue: [
        { speaker: 'Supervisor', text: 'Please write the date at the top of this form.' },
        { speaker: 'Trainee', text: 'Sorry. Could you repeat that, please?' },
        { speaker: 'Supervisor', text: 'Write the date here, at the top.' },
        { speaker: 'Trainee', text: 'Thank you. Could you show me where to write my name?' },
        { speaker: 'Supervisor', text: 'Write your name in this box.' },
        { speaker: 'Trainee', text: 'The date at the top and my name in this box. Is that correct?' }
      ],
      tips: ['Could you… please? makes a clear, polite request.', 'Say which detail you do not understand.', 'Repeat the instruction in your own words to check it.', 'Asking for clarification is a useful workplace skill.'],
      prompt: 'You are filling in a new form and do not understand the instruction. Ask the supervisor to repeat it, show you the name box, and check your understanding.',
      starter: 'Sorry. Could you repeat…?',
      modelAnswer: 'Sorry. Could you repeat the instruction, please? Could you show me where to write my name? I write the date at the top and my name in this box. Is that correct?',
      targets: ['repeat', 'please', 'show', 'name', 'correct'],
      tasks: ['Ask a partner to repeat one instruction.', 'Ask them to show you where to write information on a form.', 'Repeat the instruction and ask Is that correct?']
    },
    {
      id: 'job-interview', title: 'Your first job interview', category: 'work', level: 'A2', minutes: 10,
      description: 'Describe a useful skill and support it with an honest example.',
      objective: 'Introduce your studies, explain one strength, and ask a relevant question.',
      vocabulary: [
        { word: 'experience', meaning: 'Knowledge gained from doing something.', example: 'I have experience with group projects.', thai: 'ประสบการณ์' },
        { word: 'skill', meaning: 'An ability to do something well.', example: 'Record keeping is a useful skill.', thai: 'ทักษะ' },
        { word: 'responsible', meaning: 'Trusted to do a task carefully and reliably.', example: 'I am responsible for checking the list.', thai: 'มีความรับผิดชอบ / รับผิดชอบ' },
        { word: 'team', meaning: 'A group of people working together.', example: 'I enjoy working in a team.', thai: 'ทีม / คณะทำงาน' },
        { word: 'training', meaning: 'Learning the skills needed for a task or job.', example: 'What training do new staff receive?', thai: 'การฝึกอบรม' },
        { word: 'improve', meaning: 'Become better at something.', example: 'I want to improve my English.', thai: 'พัฒนา / ปรับปรุงให้ดีขึ้น' }
      ],
      dialogue: [
        { speaker: 'Interviewer', text: 'Please tell me a little about yourself.' },
        { speaker: 'Applicant', text: 'I study logistics. I enjoy organising information and working in a team.' },
        { speaker: 'Interviewer', text: 'Can you give me an example of a useful skill?' },
        { speaker: 'Applicant', text: 'I can use spreadsheets. Last term, I recorded stock for a class project.' },
        { speaker: 'Interviewer', text: 'Do you have a question about the role?' },
        { speaker: 'Applicant', text: 'Yes. What training do new staff receive?' }
      ],
      tips: ['Connect a skill to a real example rather than making a general claim.', 'Class projects and volunteering can provide relevant examples.', 'Use can for an ability: I can use spreadsheets.', 'Be honest about your current level and what you want to learn.'],
      prompt: 'Introduce yourself for an entry-level role. Explain one skill with a real or practice example, and ask about training.',
      starter: 'I study… One of my skills is… For example…',
      modelAnswer: 'I study logistics and I enjoy working in a team. I can use spreadsheets. Last term, I recorded stock for a class project. I would like to improve my workplace English. What training do new staff receive?',
      targets: ['study', 'team', 'can', 'project', 'training'],
      tasks: ['Choose one genuine skill and one example that supports it.', 'Give a thirty-second answer to Tell me about yourself.', 'Ask a partner one relevant question about the role.']
    },
    {
      id: 'progress-update', title: 'Give a clear progress update', category: 'work', level: 'B1', minutes: 12,
      description: 'Explain what is complete, what is still needed, and what happens next.',
      objective: 'Deliver a concise update with completed work, one issue, and a specific next step.',
      vocabulary: [
        { word: 'completed', meaning: 'Finished.', example: 'I have completed the first section.', thai: 'เสร็จสมบูรณ์แล้ว' },
        { word: 'deadline', meaning: 'The latest time or date work should be finished.', example: 'The deadline is Friday at four.', thai: 'กำหนดส่งงาน' },
        { word: 'outstanding', meaning: 'Not yet completed or dealt with.', example: 'One table is still outstanding.', thai: 'ที่ยังไม่เสร็จ / ที่ยังค้างอยู่' },
        { word: 'issue', meaning: 'A problem or matter that needs attention.', example: 'There is an issue with the missing figures.', thai: 'ปัญหา / ประเด็นที่ต้องจัดการ' },
        { word: 'next step', meaning: 'The action to take after the current one.', example: 'The next step is to check the totals.', thai: 'ขั้นตอนถัดไป' },
        { word: 'update', meaning: 'Give or receive the latest information.', example: 'I will update you by three.', thai: 'แจ้งความคืบหน้า / ข้อมูลล่าสุด' }
      ],
      dialogue: [
        { speaker: 'Supervisor', text: 'Could you give me an update on the report?' },
        { speaker: 'Trainee', text: 'I have completed the introduction and checked the first table.' },
        { speaker: 'Supervisor', text: 'Is anything still outstanding?' },
        { speaker: 'Trainee', text: 'Yes. I still need the sales figures to finish the second table.' },
        { speaker: 'Supervisor', text: 'What is your next step?' },
        { speaker: 'Trainee', text: 'I will request the figures now and update you by three. The deadline is tomorrow at four.' }
      ],
      tips: ['Start with the current position, then explain the issue.', 'Use I have completed for work finished before now.', 'Distinguish a confirmed deadline from your estimated completion time.', 'Give a next action and a time for your next update.'],
      prompt: 'Report this practice situation: the introduction and first table are complete, sales figures are missing, and the deadline is tomorrow at four. Say what you will do next and when you will update your supervisor.',
      starter: 'I have completed… I still need… My next step is…',
      modelAnswer: 'I have completed the introduction and the first table. I still need the sales figures for the second table. My next step is to request the missing information. I will update you by three today. The deadline is tomorrow at four.',
      targets: ['completed', 'need', 'figures', 'update', 'deadline'],
      tasks: ['Sort a practice task into finished work, unfinished work, and next actions.', 'Give a forty-five-second update without reading a full script.', 'Ask a partner for one detail that would make their update clearer.']
    },
    {
      id: 'on-board-introductions', title: 'Introduce yourself on board', category: 'maritime', level: 'A1', minutes: 8,
      description: 'Introduce your role and ask for a crew member’s name clearly.',
      objective: 'State your name and training role, then ask and answer a simple question.',
      vocabulary: [
        { word: 'vessel', meaning: 'A ship or large boat.', example: 'The vessel is called Orion.', thai: 'เรือ' },
        { word: 'crew', meaning: 'The people who work on a ship.', example: 'The crew work together.', thai: 'ลูกเรือ / ผู้ปฏิบัติงานบนเรือ' },
        { word: 'cadet', meaning: 'A person training for an officer role.', example: 'I am a deck cadet.', thai: 'นักเรียนฝึกนายประจำเรือ' },
        { word: 'department', meaning: 'A group responsible for a particular area of work.', example: 'I am in the deck department.', thai: 'แผนก' },
        { word: 'cabin', meaning: 'A room used for living or sleeping on a ship.', example: 'My cabin is on this deck.', thai: 'ห้องพักบนเรือ' },
        { word: 'on board', meaning: 'On a ship, aircraft, or other vehicle.', example: 'Welcome on board.', thai: 'บนเรือ' }
      ],
      dialogue: [
        { speaker: 'Crew member', text: 'Good morning. Welcome on board.' },
        { speaker: 'Cadet', text: 'Good morning. My name is Arun. I am a deck cadet.' },
        { speaker: 'Crew member', text: 'Nice to meet you, Arun. I am Sam.' },
        { speaker: 'Cadet', text: 'Nice to meet you. Could you repeat your name, please?' },
        { speaker: 'Crew member', text: 'Sam. S–A–M.' },
        { speaker: 'Cadet', text: 'Thank you, Sam. I am pleased to join the crew.' }
      ],
      tips: ['Use I am a… before a job or training role.', 'Speak names clearly and ask for spelling when needed.', 'Say the department only when it is relevant to the introduction.', 'These are general English practice lines, not a substitute for required shipboard procedures.'],
      prompt: 'You are a new cadet in a practice role-play. Greet a crew member, give your name and department, and ask them to repeat their name.',
      starter: 'Good morning. My name is… I am a…',
      modelAnswer: 'Good morning. My name is Arun. I am a deck cadet. I am pleased to join the crew. Could you repeat your name, please?',
      targets: ['name', 'deck', 'cadet', 'crew', 'repeat'],
      tasks: ['Introduce your name and role in two sentences.', 'Ask a partner to spell their name and repeat it back.', 'Switch roles and welcome the new cadet on board.']
    },
    {
      id: 'places-on-board', title: 'Find places on board', category: 'maritime', level: 'A2', minutes: 10,
      description: 'Recognise common shipboard locations and check a simple direction.',
      objective: 'Ask for a location, repeat the direction, and distinguish common room names.',
      vocabulary: [
        { word: 'bridge', meaning: 'The area from which a ship is navigated and controlled.', example: 'The officer is on the bridge.', thai: 'สะพานเดินเรือ' },
        { word: 'engine room', meaning: 'The space containing the ship’s main machinery.', example: 'The engineer works in the engine room.', thai: 'ห้องเครื่อง' },
        { word: 'mess room', meaning: 'A room where crew members eat meals.', example: 'Lunch is in the mess room.', thai: 'ห้องรับประทานอาหารลูกเรือ' },
        { word: 'galley', meaning: 'The kitchen on a ship.', example: 'The cook is in the galley.', thai: 'ห้องครัวบนเรือ' },
        { word: 'stairway', meaning: 'A set of stairs connecting different levels.', example: 'Use this stairway to go down one deck.', thai: 'บันได' },
        { word: 'deck', meaning: 'A level or floor of a ship.', example: 'The mess room is one deck below us.', thai: 'ชั้นของเรือ / ดาดฟ้าเรือ' }
      ],
      dialogue: [
        { speaker: 'Cadet', text: 'Excuse me. Where is the mess room?' },
        { speaker: 'Crew member', text: 'In this practice layout, it is one deck below us.' },
        { speaker: 'Cadet', text: 'Which stairway should I use?' },
        { speaker: 'Crew member', text: 'Use this stairway. Go down one deck, then turn left.' },
        { speaker: 'Cadet', text: 'Down one deck, then left. Is the mess room beside the galley?' },
        { speaker: 'Crew member', text: 'Yes, in this layout. Check the sign at the door.' }
      ],
      tips: ['A galley is a kitchen; a mess room is a place for eating.', 'Use on for a deck and in for a room: on this deck, in the mess room.', 'Repeat level changes and turning directions to check understanding.', 'This is a fictional practice layout. Actual ship layouts and access rules differ.'],
      prompt: 'In the practice layout, the mess room is one deck below you, to the left of the stairway, beside the galley. Ask where it is, then repeat the directions to check them.',
      starter: 'Excuse me. Where is the mess room? So, I go…',
      modelAnswer: 'Excuse me. Where is the mess room? So, I go down one deck and turn left. The mess room is beside the galley. Is that correct?',
      targets: ['mess', 'down', 'deck', 'left', 'galley'],
      tasks: ['Match each room name to its purpose.', 'Explain a simple route using a fictional layout you and a partner agree on.', 'Ask for clarification when a direction is incomplete.']
    },
    {
      id: 'reporting-an-observation', title: 'Report what you observed', category: 'maritime', level: 'B1', minutes: 12,
      description: 'Make a clear report with a location, time, and observed facts.',
      objective: 'Describe a maintenance observation without inventing its cause or claiming a repair.',
      vocabulary: [
        { word: 'observe', meaning: 'Notice something by watching or paying attention.', example: 'I observed the light flickering twice.', thai: 'สังเกต' },
        { word: 'flicker', meaning: 'Shine with repeated changes in brightness.', example: 'The light outside the cabin is flickering.', thai: 'กะพริบ / ส่องแสงติด ๆ ดับ ๆ' },
        { word: 'passageway', meaning: 'A corridor or route between spaces on a ship.', example: 'The light is in the passageway.', thai: 'ทางเดินบนเรือ' },
        { word: 'location', meaning: 'The place where something is.', example: 'Please give the exact location.', thai: 'ตำแหน่ง / สถานที่' },
        { word: 'cause', meaning: 'The reason something happens.', example: 'I do not know the cause.', thai: 'สาเหตุ' },
        { word: 'maintenance', meaning: 'Work done to keep equipment or a place in good condition.', example: 'Please record the problem for maintenance.', thai: 'การบำรุงรักษา' }
      ],
      dialogue: [
        { speaker: 'Cadet', text: 'I would like to report a problem with a light.' },
        { speaker: 'Duty officer', text: 'Please give the location and tell me what you observed.' },
        { speaker: 'Cadet', text: 'It is in the passageway outside cabin twelve. The light flickered twice.' },
        { speaker: 'Duty officer', text: 'When did you notice it? Do you know the cause?' },
        { speaker: 'Cadet', text: 'At nine twenty this morning. I do not know the cause and have not checked the fitting.' },
        { speaker: 'Duty officer', text: 'Thank you for the clear report. I will record the observation.' }
      ],
      tips: ['Give the observation, location, and time.', 'Use the past simple for what you noticed: The light flickered.', 'Say I do not know when a cause has not been confirmed.', 'This activity practises reporting language. Use the vessel’s actual reporting and safety procedures for real faults.'],
      prompt: 'In this practice scenario, a passageway light outside cabin 12 flickered twice at 09:20. You have not checked the fitting and do not know the cause. Report only these facts and ask for the observation to be recorded.',
      starter: 'I would like to report… I noticed it at…',
      modelAnswer: 'I would like to report a problem with the passageway light outside cabin twelve. It flickered twice at nine twenty this morning. I do not know the cause and have not checked the fitting. Could you record the observation for maintenance, please?',
      targets: ['light', 'cabin', 'flickered', 'cause', 'maintenance'],
      tasks: ['Identify the observation, location, and time in the scenario.', 'Give a concise spoken report without adding an explanation you cannot confirm.', 'Ask a partner to repeat the location and time to check your clarity.']
    }
  ];

  const scenarios = [
    {
      id: 'new-classmate', title: 'A new classmate', category: 'everyday', level: 'A1',
      description: 'Have a friendly first conversation at college.', role: 'New student', coachRole: 'Classmate',
      opening: 'Hi! I am Alex. Welcome to the class. Let’s get to know each other.',
      turns: [
        { question: 'What is your name, and where are you from?', hint: 'Use My name is… and I am from…', example: 'My name is Mina. I am from Chonburi.', keywords: ['name', 'from'] },
        { question: 'What do you study, and what do you enjoy about it?', hint: 'Name your course and one thing you like.', example: 'I study logistics. I enjoy learning about transport.', keywords: ['study', 'enjoy', 'like'] },
        { question: 'What do you usually do after class?', hint: 'Describe one activity. Try I usually…', example: 'I usually play football after class.', keywords: ['usually', 'after'] },
        { question: 'What would you like to practise in English this term?', hint: 'Give one personal goal using I want to…', example: 'I want to practise speaking and learn new words.', keywords: ['want', 'practise', 'learn'] }
      ]
    },
    {
      id: 'study-session', title: 'Plan a study session', category: 'everyday', level: 'B1',
      description: 'Agree on a time, place, and useful tasks with a classmate.', role: 'Study partner', coachRole: 'Classmate',
      opening: 'Our presentation is coming up. Let’s arrange a session so we can prepare together.',
      turns: [
        { question: 'I am free on Friday afternoon. Does that work for you? If not, what could we do instead?', hint: 'Accept the suggestion or offer a clear alternative.', example: 'I have work on Friday. Could we meet on Saturday morning instead?', keywords: ['friday', 'saturday', 'instead', 'available'] },
        { question: 'Where would you prefer to meet, and why?', hint: 'Choose a place and give a reason with because.', example: 'I prefer the library because it is quiet and we can use a large table.', keywords: ['prefer', 'because'] },
        { question: 'What should we work on first, and what will you bring?', hint: 'Name a first task and something useful to bring.', example: 'Let’s choose the main points first. I will bring my notes and a laptop.', keywords: ['first', 'bring', 'notes'] },
        { question: 'Could you confirm our final plan in one or two sentences?', hint: 'Repeat the agreed time, place, and purpose.', example: 'We will meet on Saturday at ten in the library. We will choose the main points and practise the presentation.', keywords: ['meet', 'at', 'presentation'] }
      ]
    },
    {
      id: 'cafe-order', title: 'At the café counter', category: 'everyday', level: 'A2',
      description: 'Order a vegetable rice bowl and water, choose takeaway, and confirm the details.', role: 'Café customer', coachRole: 'Cashier',
      opening: 'Welcome to our practice café. In this role play, you want one vegetable rice bowl for eighty baht and one bottle of still water for twenty baht. You want to take the order away.',
      turns: [
        { question: 'What would you like to eat today?', hint: 'Use I would like… and give the dish and quantity from the scenario.', example: 'I would like one vegetable rice bowl, please.', keywords: ['like', 'rice', 'bowl'] },
        { question: 'What would you like to drink?', hint: 'Ask for one bottle of still water.', example: 'Could I have a bottle of still water, please?', keywords: ['bottle', 'still', 'water'] },
        { question: 'Would you like to eat here or take your order away?', hint: 'Use the scenario preference: you want to take it away.', example: 'To take away, please.', keywords: ['take', 'away', 'please'] },
        { question: 'The total is one hundred baht. Could you confirm your order and tell me if you need a receipt?', hint: 'Repeat the food, drink, takeaway preference, and total. Ask for a receipt if you would like one.', example: 'One vegetable rice bowl and a bottle of still water, to take away. The total is one hundred baht. Could I have a receipt, please?', keywords: ['rice', 'water', 'hundred', 'receipt'] }
      ]
    },
    {
      id: 'hotel-reception', title: 'At the hotel desk', category: 'travel', level: 'A2',
      description: 'Check in, provide clear booking details, and ask a practical question.', role: 'Hotel guest', coachRole: 'Receptionist',
      opening: 'Good evening. Welcome to our practice hotel. I can help you with your arrival.',
      turns: [
        { question: 'Do you have a reservation? What name is it under?', hint: 'Use I have a reservation under the name…', example: 'Yes. I have a reservation under the name Lee.', keywords: ['reservation', 'name'] },
        { question: 'Could you spell your surname and tell me how many nights you booked?', hint: 'Spell the name slowly and use for… nights.', example: 'My surname is Lee: L–E–E. I booked for two nights.', keywords: ['surname', 'nights', 'booked'] },
        { question: 'Is there anything you would like to request or ask about the room?', hint: 'Make a polite request with Could I…? or Could you…?', example: 'Could I have information about the Wi-Fi, please?', keywords: ['could', 'please'] },
        { question: 'Before you go to your room, what would you like to check about your departure?', hint: 'Ask about check-out time or how to get a receipt.', example: 'Could you tell me the check-out time? I would also like a receipt, please.', keywords: ['time', 'receipt', 'check-out'] }
      ]
    },
    {
      id: 'missed-connection', title: 'A missed connection', category: 'travel', level: 'B1',
      description: 'Explain a disrupted journey and ask about alternatives and conditions.', role: 'Traveller', coachRole: 'Customer service agent',
      opening: 'Hello. You are at the travel assistance desk in this role-play. Tell me what you need help with.',
      turns: [
        { question: 'What happened to your journey?', hint: 'Describe the event and its effect using so.', example: 'My first flight was delayed, so I missed my connection.', keywords: ['delayed', 'missed', 'connection'] },
        { question: 'What is your final destination, and when do you hope to arrive?', hint: 'Give a destination and a specific time or date.', example: 'My final destination is Bangkok. I hope to arrive before six this evening.', keywords: ['destination', 'arrive', 'before'] },
        { question: 'What would you like me to check before you choose an alternative?', hint: 'Ask about availability, arrival time, or extra charges.', example: 'Could you check the next available flight and tell me about any extra charges?', keywords: ['check', 'available', 'charges', 'time'] },
        { question: 'What details will you confirm before accepting a new booking?', hint: 'Mention timing, destination, and any conditions that matter.', example: 'I will confirm the destination, departure and arrival times, and the total cost before I accept.', keywords: ['confirm', 'times', 'cost', 'destination'] }
      ]
    },
    {
      id: 'first-interview', title: 'Your first interview', category: 'work', level: 'A2',
      description: 'Introduce your strengths using clear examples from study or work.', role: 'Entry-level applicant', coachRole: 'Interviewer',
      opening: 'Thank you for coming to this practice interview. We will talk about your studies, skills, and interests.',
      turns: [
        { question: 'Could you tell me about yourself and what you study?', hint: 'Keep your answer relevant to learning and work.', example: 'I study logistics. I enjoy organising information and learning practical skills.', keywords: ['study', 'enjoy', 'skills'] },
        { question: 'What is one useful skill you have? Can you give an example?', hint: 'Use I can… followed by a specific example.', example: 'I can use spreadsheets. I recorded stock for a class project last term.', keywords: ['can', 'example', 'project'] },
        { question: 'How have you helped a team complete a task?', hint: 'Say what your team did and what you personally contributed.', example: 'My team prepared a presentation. I checked the information and organised our slides.', keywords: ['team', 'helped', 'checked', 'organised'] },
        { question: 'What would you like to ask me about the role?', hint: 'Ask about training, responsibilities, or the working day.', example: 'What training do new staff receive, and what would my main responsibilities be?', keywords: ['training', 'responsibilities', 'what'] }
      ]
    },
    {
      id: 'maintenance-report', title: 'A clear on-board report', category: 'maritime', level: 'B1',
      description: 'Practise reporting a flickering passageway light using observed facts.', role: 'Cadet reporting an observation', coachRole: 'Duty officer',
      opening: 'This is an English reporting exercise. You noticed a passageway light flicker twice outside cabin 12 at 09:20. You have not checked the fitting and do not know the cause.',
      turns: [
        { question: 'What did you observe?', hint: 'Describe the light and what happened without guessing why.', example: 'I noticed a passageway light flicker twice.', keywords: ['light', 'flicker', 'twice'] },
        { question: 'Where exactly is the light?', hint: 'Give the space and cabin number.', example: 'It is in the passageway outside cabin twelve.', keywords: ['passageway', 'outside', 'twelve'] },
        { question: 'When did you notice it, and do you know the cause?', hint: 'Give 09:20 and say honestly that the cause is unknown.', example: 'I noticed it at nine twenty this morning. I do not know the cause.', keywords: ['twenty', 'morning', 'cause'] },
        { question: 'Have you checked the fitting, and what would you like me to record?', hint: 'Use the given facts: no inspection, and a request to record the observation.', example: 'I have not checked the fitting. Please record the flickering light outside cabin twelve for maintenance.', keywords: ['not', 'checked', 'record', 'maintenance'] }
      ]
    }
  ];

  const pronunciation = [
    { id: 'name-and-pause', title: 'Introduce yourself in thought groups', focus: 'Pausing', phrase: 'My name is Mina, and I am a student.', tip: 'Pause briefly after Mina. Say the two ideas in comfortable groups, without rushing.', thai: 'ฉันชื่อมีนา และฉันเป็นนักเรียน' },
    { id: 'repeat-message', title: 'Make a clear repeat request', focus: 'Word stress', phrase: 'Please repeat your message.', tip: 'Give repeat two syllables: re-PEAT. Stress the first syllable of MES-sage. Keep please clear and polite.', thai: 'กรุณาพูดข้อความของคุณซ้ำอีกครั้ง' },
    { id: 'daily-times', title: 'Keep word endings audible', focus: 'Final consonants', phrase: 'I work from eight until five.', tip: 'Keep the final sounds in work, eight, and five audible. Avoid adding an extra vowel after each ending.', thai: 'ฉันทำงานตั้งแต่แปดโมงถึงห้าโมง' },
    { id: 'left-and-right', title: 'Say left and right clearly', focus: 'L and R sounds', phrase: 'Turn left, then turn right.', tip: 'For the first sound in left, let your tongue touch just behind the upper teeth. For the first sound in right, avoid that contact. Practise slowly, then say the full phrase.', thai: 'เลี้ยวซ้าย แล้วเลี้ยวขวา' },
    { id: 'two-nights', title: 'Make the number of nights clear', focus: 'Plural endings', phrase: 'I would like a room for two nights.', tip: 'Keep the final consonant group in nights clear. Do not add a new syllable after the final s sound.', thai: 'ฉันต้องการห้องพักสำหรับสองคืน' },
    { id: 'polite-question', title: 'Use a friendly request', focus: 'Intonation', phrase: 'Could you show me the way, please?', tip: 'Use a relaxed voice and a small pause before please. Try a gentle rise near the end; natural speakers also use other patterns.', thai: 'ช่วยบอกทางให้ฉันหน่อยได้ไหม' },
    { id: 'see-ships', title: 'Contrast see and ships', focus: 'S and SH sounds', phrase: 'I can see three ships.', tip: 'For see, make a narrow s sound. For ships, round your lips a little for sh. Listen to the contrast before joining the sentence.', thai: 'ฉันมองเห็นเรือสามลำ' },
    { id: 'three-thirty', title: 'Practise three and thirty', focus: 'TH sound', phrase: 'The ship leaves at three thirty.', tip: 'For the first sound in three and thirty, place the tip of your tongue lightly between your teeth and let air flow. Keep the number easy to understand.', thai: 'เรือออกเวลาสามโมงครึ่ง' },
    { id: 'bridge-next-deck', title: 'Keep consonant groups together', focus: 'Consonant clusters', phrase: 'The bridge is on the next deck.', tip: 'Keep bridge and next as one syllable each. Start slowly, then join the words while keeping deck clear.', thai: 'สะพานเดินเรืออยู่บนชั้นถัดไป' },
    { id: 'check-date', title: 'Highlight the important information', focus: 'Sentence stress', phrase: 'Please check the date before you send it.', tip: 'Try making check, date, and send a little stronger. Keep the connecting words lighter and comfortable.', thai: 'กรุณาตรวจสอบวันที่ก่อนส่ง' },
    { id: 'task-update', title: 'Separate two contrasting ideas', focus: 'Thought groups', phrase: 'I have finished the first task, but the second needs more time.', tip: 'Pause briefly after task. Give second and more time enough emphasis to make the contrast clear.', thai: 'ฉันทำงานแรกเสร็จแล้ว แต่งานที่สองต้องใช้เวลาเพิ่ม' },
    { id: 'cabin-twelve', title: 'Give a clear location', focus: 'Key words and numbers', phrase: 'I noticed a problem near cabin twelve.', tip: 'Make problem and cabin twelve clear. Keep twelve as one syllable and repeat the number if your partner is unsure.', thai: 'ฉันสังเกตเห็นปัญหาบริเวณใกล้ห้องพักหมายเลขสิบสอง' },
    { id: 'order-water', title: 'Make a polite drink request', focus: 'Sentence stress', phrase: 'Could I have a bottle of water, please?', tip: 'Make bottle and water clear. Keep Could I have at a comfortable pace, with a light pause before please if it helps.', thai: 'ขอน้ำดื่มหนึ่งขวดได้ไหม' },
    { id: 'food-takeaway', title: 'Keep a short food order clear', focus: 'Thought groups and word endings', phrase: 'One rice bowl to take away, please.', tip: 'Try two groups: One rice bowl / to take away, please. Keep the final s sound in rice audible without adding another syllable.', thai: 'ขอข้าวหนึ่งชามกลับบ้านด้วย' }
  ];

  const quiz = [
    { id: 'q01', category: 'everyday', level: 'A1', question: 'Someone asks, “Where are you from?” Which answer gives the information requested?', options: ['I am from Chiang Mai.', 'My name is Mina.', 'I study logistics.', 'I like drawing.'], answer: 0, explanation: 'Where are you from? asks about your place of origin. I am from Chiang Mai answers that question directly.' },
    { id: 'q02', category: 'everyday', level: 'A1', question: 'Complete the sentence: “She ___ English every morning.”', options: ['study', 'studies', 'studying', 'to study'], answer: 1, explanation: 'The present simple uses studies with she. Change the final y in study to ies after the consonant d.' },
    { id: 'q03', category: 'everyday', level: 'A2', question: 'Which sentence correctly describes a usual routine?', options: ['I usually starts at eight.', 'I starts usually at eight.', 'I usually start at eight.', 'I usually starting at eight.'], answer: 2, explanation: 'Use start with I in the present simple. Usually naturally comes before the main verb.' },
    { id: 'q04', category: 'everyday', level: 'A2', question: '“First I get dressed. Then I have breakfast.” Which sentence has the same meaning?', options: ['I get dressed after breakfast.', 'I have breakfast while getting dressed.', 'I do not have breakfast.', 'I get dressed before breakfast.'], answer: 3, explanation: 'Getting dressed happens first, so it happens before breakfast.' },
    { id: 'q05', category: 'everyday', level: 'B1', question: 'A classmate suggests meeting on Friday, but you are busy. Which reply politely offers an alternative?', options: ['I am busy on Friday. Could we meet on Saturday instead?', 'Friday works for me. Let’s meet then.', 'Could you tell me where the library is?', 'I am sorry, but I cannot meet on Friday.'], answer: 0, explanation: 'The answer explains the difficulty and suggests another time using Could we… instead?' },
    { id: 'q06', category: 'everyday', level: 'A1', question: 'What does “Could you say that again, please?” ask the other person to do?', options: ['Change the subject.', 'Repeat their words.', 'Write your name.', 'Finish the conversation.'], answer: 1, explanation: 'Say that again means repeat what was said. It is a useful polite clarification request.' },
    { id: 'q07', category: 'everyday', level: 'B1', question: 'Choose the word that introduces the reason: “I prefer studying in the library ___ it is quiet.”', options: ['but', 'although', 'because', 'unless'], answer: 2, explanation: 'Because introduces the reason for a preference. The quiet environment explains the choice of the library.' },
    { id: 'q08', category: 'everyday', level: 'A2', question: 'Complete the confirmed arrangement: “We ___ meeting at ten tomorrow.”', options: ['is', 'am', 'be', 'are'], answer: 3, explanation: 'We takes are. Are meeting can describe a planned future arrangement.' },
    { id: 'q09', category: 'travel', level: 'A1', question: 'The directions are “Go straight ahead, then turn left.” What should you do first?', options: ['Go straight ahead.', 'Turn left immediately.', 'Turn right.', 'Go back the way you came.'], answer: 0, explanation: 'Then introduces the next action. The first action is to go straight ahead.' },
    { id: 'q10', category: 'travel', level: 'A1', question: 'In street directions, “The bank is opposite the station” means the bank is…', options: ['inside the station.', 'facing the station from the other side.', 'on the same floor above the station.', 'somewhere far from the station.'], answer: 1, explanation: 'Opposite means facing something from the other side, such as across the street.' },
    { id: 'q11', category: 'travel', level: 'A2', question: 'You have already booked a hotel room. Which sentence clearly starts check-in?', options: ['I would like to book a room for next month.', 'I would like to change my departure date.', 'I have a reservation under the name Lee.', 'Could you give me directions to the station?'], answer: 2, explanation: 'I have a reservation under the name… tells the receptionist that you have an existing booking and gives the name to look for.' },
    { id: 'q12', category: 'travel', level: 'A2', question: 'The receptionist asks you to spell your surname, Lee. Which response answers the request?', options: ['I booked for two nights.', 'My room is on the second floor.', 'My first name is Mina.', 'My surname is Lee: L–E–E.'], answer: 3, explanation: 'The request is for the spelling of the family name. Saying the name and its letters gives the required information.' },
    { id: 'q13', category: 'travel', level: 'B1', question: 'A notice says, “The 10:00 train is cancelled. The next train leaves at 11:30.” Which statement is supported by the notice?', options: ['The next train leaves at 11:30.', 'All trains are cancelled today.', 'The train was cancelled because of rain.', 'Every passenger will receive a free hotel room.'], answer: 0, explanation: 'Only the 11:30 departure is stated. The notice does not provide a cause, cancel all trains, or promise accommodation.' },
    { id: 'q14', category: 'travel', level: 'B1', question: 'Your service has been cancelled. Which question politely asks about alternatives?', options: ['When was the cancellation announced?', 'What other services are available?', 'Where is the information desk?', 'Could you tell me the original ticket price?'], answer: 1, explanation: 'What other services are available? asks for useful options without assuming that a new booking has already been made.' },
    { id: 'q15', category: 'travel', level: 'A2', question: 'You have paid and need a written record of the payment. What should you ask?', options: ['Could I have a room key, please?', 'Could I have a wake-up call, please?', 'Could I have a receipt, please?', 'Could I have the Wi-Fi password, please?'], answer: 2, explanation: 'A receipt is a record showing that a payment was made.' },
    { id: 'q16', category: 'travel', level: 'B1', question: '“My first flight was delayed, so I missed my connection.” What was the result of the delay?', options: ['The traveller arrived early.', 'The traveller changed their surname.', 'The first flight left before its scheduled time.', 'The traveller missed the next flight in the journey.'], answer: 3, explanation: 'So introduces the result. A connection is a later service that continues the journey.' },
    { id: 'q17', category: 'work', level: 'A1', question: 'A colleague is speaking too quickly for you to understand. Which request is most useful?', options: ['Could you speak more slowly, please?', 'Could you write my name on the form?', 'Could you tell me when the office closes?', 'Could you send me tomorrow’s schedule?'], answer: 0, explanation: 'Asking the speaker to slow down addresses the difficulty directly and politely.' },
    { id: 'q18', category: 'work', level: 'A1', question: 'You need a demonstration of where to enter information on a form. What should you say?', options: ['Could you tell me when the form is due?', 'Could you show me where to write it?', 'Could I have another blank copy?', 'Could you repeat the office address?'], answer: 1, explanation: 'Could you show me…? asks for a demonstration. Specifying where to write it makes the request clear.' },
    { id: 'q19', category: 'work', level: 'A2', question: 'Which answer supports a workplace skill with a specific example?', options: ['I enjoy working in a team and learning new things.', 'I am organised and careful with details.', 'I can use spreadsheets. I recorded stock for a class project.', 'I would like to develop my computer skills.'], answer: 2, explanation: 'The answer names an ability and explains how it was used. Specific examples make interview answers more informative.' },
    { id: 'q20', category: 'work', level: 'A2', question: 'Complete the sentence: “Last term, I ___ on a group project.”', options: ['work', 'working', 'works', 'worked'], answer: 3, explanation: 'Last term is a completed past period. Use the past simple worked.' },
    { id: 'q21', category: 'work', level: 'B1', question: 'The first report section is finished, but the sales figures have not arrived. Which update accurately describes the situation?', options: ['The first section is complete. I still need the sales figures.', 'The entire report is finished and checked.', 'All sales figures have arrived.', 'No work has been completed.'], answer: 0, explanation: 'A clear update distinguishes finished work from information that is still needed.' },
    { id: 'q22', category: 'work', level: 'B1', question: 'What does deadline mean in a task update?', options: ['The person who reads the report.', 'The latest time or date the work should be finished.', 'The title at the top of a document.', 'The number of people in a team.'], answer: 1, explanation: 'A deadline is the latest agreed or required time for completion. It is different from a progress update or a task title.' },
    { id: 'q23', category: 'work', level: 'B1', question: 'You are assigned an unfamiliar task and need to check what is involved. Which reply gives a realistic next step?', options: ['It is already complete, although I have not started.', 'I guarantee it will take exactly one minute.', 'I will check what is needed and update you by three.', 'There is no reason to discuss the task again.'], answer: 2, explanation: 'This reply commits to a useful action and a specific update time without inventing a completion estimate.' },
    { id: 'q24', category: 'maritime', level: 'A1', question: 'In shipboard English, the crew are…', options: ['only the passengers visiting the ship.', 'the meals prepared in the galley.', 'the rooms used for sleeping.', 'the people who work on the ship.'], answer: 3, explanation: 'Crew refers to the people working on a ship.' },
    { id: 'q25', category: 'maritime', level: 'A1', question: 'What is a galley?', options: ['The kitchen on a ship.', 'A room used for sleeping.', 'The front page of a report.', 'A person training for an officer role.'], answer: 0, explanation: 'The galley is the ship’s kitchen. The mess room is where crew members eat meals.' },
    { id: 'q26', category: 'maritime', level: 'A2', question: 'In a fictional practice layout, the instruction is “Go down one deck, then turn left.” Which repeat-back matches it?', options: ['Up one deck, then right.', 'Down one deck, then left.', 'Down two decks, then right.', 'Stay on this deck and go straight.'], answer: 1, explanation: 'Repeating the level change and direction accurately helps check understanding.' },
    { id: 'q27', category: 'maritime', level: 'A2', question: 'Your partner cannot hear the practice vessel name ORION clearly. Which reply repeats and spells it correctly?', options: ['The name is ORION: O–R–I–A–N.', 'The vessel arrives tomorrow.', 'Our vessel name is ORION: O–R–I–O–N.', 'The name is ORION: O–I–R–O–N.'], answer: 2, explanation: 'O–R–I–O–N correctly spells ORION. This is a general English spelling exercise, not a radio-procedure assessment.' },
    { id: 'q28', category: 'maritime', level: 'B1', question: 'You only observed a corridor light flicker twice at 09:20. Which report stays with the observed facts?', options: ['The entire electrical system has failed.', 'The light has been repaired.', 'A damaged cable definitely caused the fault.', 'The corridor light flickered twice at 09:20.'], answer: 3, explanation: 'Report what you saw and when. The scenario does not establish a system failure, a cause, or a completed repair.' },
    { id: 'q29', category: 'maritime', level: 'B1', question: 'You notice water near a sink but do not know where it came from. Which sentence separates observation from uncertainty?', options: ['I noticed water near the sink. I have not identified the source.', 'The pipe has definitely broken.', 'Someone certainly spilled a bucket.', 'There is no water and nothing to report.'], answer: 0, explanation: 'The first sentence describes the observation; the second states what is not known. It avoids guessing a cause.' },
    { id: 'q30', category: 'maritime', level: 'B1', question: 'You are unsure whether a colleague said cabin 12 or cabin 20. What should you ask?', options: ['I will choose a cabin without checking.', 'Please confirm: cabin twelve or cabin twenty?', 'Why are all cabins on the same deck?', 'I have already checked both cabins.'], answer: 1, explanation: 'A specific confirmation question resolves the uncertain number without guessing or claiming an action you have not taken.' },
    { id: 'q31', category: 'everyday', level: 'A1', question: 'You want to order a drink politely. Which sentence is most suitable?', options: ['Where is the café?', 'This is my receipt.', 'Could I have a bottle of water, please?', 'The menu is on the table.'], answer: 2, explanation: 'Could I have… please? politely asks for an item. The other sentences ask for a location or give information without placing an order.' },
    { id: 'q32', category: 'everyday', level: 'A1', question: 'A server asks, “For here or to take away?” What information do they need?', options: ['How much you want to spend.', 'Whether you want ice in your drink.', 'How many people are waiting.', 'Whether you will eat there or take the order with you.'], answer: 3, explanation: 'For here means you will eat at the café or restaurant. To take away means you will take the order somewhere else.' },
    { id: 'q33', category: 'everyday', level: 'A2', question: 'On a fictional café menu, a rice bowl costs eighty baht and water costs twenty baht. You order one of each. Which question confirms the correct total?', options: ['Is the total one hundred baht?', 'Is the total sixty baht?', 'Is the total eighty baht?', 'Is the total one hundred and twenty baht?'], answer: 0, explanation: 'Eighty plus twenty is one hundred. Asking Is the total…? checks the full amount before payment.' },
    { id: 'q34', category: 'everyday', level: 'A1', question: 'What does “still water” mean on a drinks menu?', options: ['Water that must be served hot.', 'Drinking water without bubbles from added gas.', 'A sweet fruit drink.', 'A cup of tea.'], answer: 1, explanation: 'Still water is not carbonated. The word still does not tell you whether the water is cold or at room temperature.' },
    { id: 'q35', category: 'everyday', level: 'A2', question: 'You ordered water, but the server repeats “one coffee.” Which reply politely corrects the order?', options: ['Yes, one coffee is correct.', 'Where can I sit?', 'Sorry, I ordered water, not coffee.', 'Thank you for the menu.'], answer: 2, explanation: 'The reply names the requested drink and the mistaken item clearly. A short, polite correction helps the server check the order.' }
  ];

  const featureGuide = [
    {
      id: 'home', requestedLabelEn: 'Home Page', requestedLabelTh: 'หน้าหลัก',
      titleEn: 'Your learning home', titleTh: 'หน้าหลักสำหรับการเรียนรู้',
      descriptionEn: 'Start speaking, choose a lesson, and see your daily goal and recent learning activity in one place.',
      descriptionTh: 'เริ่มฝึกพูด เลือกบทเรียน และดูเป้าหมายประจำวันกับกิจกรรมการเรียนรู้ล่าสุดได้ในหน้าเดียว',
      limitationEn: 'Progress reflects the saved activities of the learner profile selected in this browser.',
      limitationTh: 'ความก้าวหน้าแสดงจากกิจกรรมที่บันทึกไว้ของโปรไฟล์ผู้เรียนที่เลือกในเบราว์เซอร์นี้',
      href: '#/home'
    },
    {
      id: 'lessons', requestedLabelEn: 'Speaking Lessons', requestedLabelTh: 'บทเรียนภาษาอังกฤษ',
      titleEn: 'Practical speaking lessons', titleTh: 'บทเรียนฝึกพูดที่นำไปใช้ได้',
      descriptionEn: 'Practise everyday, travel, work, and maritime English with vocabulary, Thai word hints, dialogues, model answers, and useful tasks. Food ordering is included.',
      descriptionTh: 'ฝึกภาษาอังกฤษในชีวิตประจำวัน การเดินทาง การทำงาน และงานทางทะเล ผ่านคำศัพท์พร้อมคำแปลไทย บทสนทนา ตัวอย่างคำตอบ และกิจกรรมฝึก รวมถึงการสั่งอาหาร',
      limitationEn: 'The A1–B1 labels guide practice choices. Finishing lessons does not certify an English level or a professional qualification.',
      limitationTh: 'ป้ายระดับ A1–B1 ช่วยเลือกเนื้อหาฝึก การเรียนจบไม่ได้รับรองระดับภาษาอังกฤษหรือคุณวุฒิทางวิชาชีพ',
      href: '#/lessons'
    },
    {
      id: 'practice', requestedLabelEn: 'AI Speaking Practice', requestedLabelTh: 'ฝึกพูดกับ AI',
      titleEn: 'Speaking practice with an optional AI coach', titleTh: 'ฝึกพูดพร้อมตัวช่วย AI แบบเลือกใช้',
      descriptionEn: 'Read a prompt, speak or type your response, edit the transcript, and get feedback. Guided mode checks words and phrases without an account.',
      descriptionTh: 'อ่านโจทย์ พูดหรือพิมพ์คำตอบ แก้ไขข้อความที่ถอดจากเสียง แล้วดูข้อเสนอแนะ โหมดฝึกตามแนวทางตรวจคำและวลีได้โดยไม่ต้องมีบัญชี',
      limitationEn: 'AI feedback requires a configured server. Guided checks do not assess pronunciation, fluency, or overall English proficiency.',
      limitationTh: 'ข้อเสนอแนะจาก AI ต้องเชื่อมต่อเซิร์ฟเวอร์ที่ตั้งค่าไว้ การตรวจในโหมดฝึกตามแนวทางไม่ได้ประเมินการออกเสียง ความคล่องแคล่ว หรือความสามารถทางภาษาโดยรวม',
      href: '#/practice'
    },
    {
      id: 'conversation', requestedLabelEn: 'AI Conversation', requestedLabelTh: 'สนทนากับ AI',
      titleEn: 'Guided and optional AI conversations', titleTh: 'บทสนทนาฝึกตามแนวทางและ AI แบบเลือกใช้',
      descriptionEn: 'Try four-turn role plays such as ordering food, checking into a hotel, or attending an interview. Hints and examples help you keep replying.',
      descriptionTh: 'ลองบทบาทสมมติสี่ช่วง เช่น สั่งอาหาร เช็กอินโรงแรม หรือสัมภาษณ์งาน พร้อมคำใบ้และตัวอย่างช่วยต่อบทสนทนา',
      limitationEn: 'Guided mode uses prepared questions. Adaptive AI replies require a configured server and may contain mistakes.',
      limitationTh: 'โหมดฝึกตามแนวทางใช้คำถามที่เตรียมไว้ คำตอบจาก AI ที่ปรับตามบทสนทนาต้องใช้เซิร์ฟเวอร์ที่ตั้งค่าไว้และอาจมีข้อผิดพลาด',
      href: '#/conversation'
    },
    {
      id: 'pronunciation', requestedLabelEn: 'Pronunciation', requestedLabelTh: 'ฝึกการออกเสียง',
      titleEn: 'Listen, read aloud, and compare words', titleTh: 'ฟัง อ่านออกเสียง และเปรียบเทียบคำ',
      descriptionEn: 'Listen to useful phrases at a normal or slower pace. Practise with sound and rhythm tips, then compare a speech transcript or typed attempt with the target phrase.',
      descriptionTh: 'ฟังวลีที่ใช้ได้จริงด้วยความเร็วปกติหรือแบบช้า ฝึกตามคำแนะนำเรื่องเสียงและจังหวะ แล้วเปรียบเทียบข้อความที่ถอดจากเสียงหรือข้อความที่พิมพ์กับวลีตัวอย่าง',
      limitationEn: 'Transcript matching does not identify acoustic pronunciation errors or measure accent and fluency. Speech recognition can mishear clear speech.',
      limitationTh: 'การเทียบข้อความไม่ได้ตรวจหาข้อผิดพลาดจากเสียงพูดจริงหรือวัดสำเนียงและความคล่องแคล่ว ระบบรู้จำเสียงอาจถอดคำผิดแม้ผู้พูดออกเสียงชัดเจน',
      href: '#/pronunciation'
    },
    {
      id: 'progress', requestedLabelEn: 'Progress Tracking', requestedLabelTh: 'ติดตามความก้าวหน้า',
      titleEn: 'Your saved learning progress', titleTh: 'ความก้าวหน้าการเรียนรู้ที่บันทึกไว้',
      descriptionEn: 'Review completed lessons, practice time, quiz results, activity history, and personal learning notes for the selected learner profile.',
      descriptionTh: 'ทบทวนบทเรียนที่เรียนจบ เวลาฝึก ผลแบบทดสอบ ประวัติกิจกรรม และบันทึกการเรียนรู้ของโปรไฟล์ผู้เรียนที่เลือก',
      limitationEn: 'Practice statistics describe saved participation. They are not an independent assessment, and local data does not automatically sync to another device.',
      limitationTh: 'สถิติการฝึกแสดงการเข้าร่วมกิจกรรมที่บันทึกไว้ ไม่ใช่ผลประเมินความสามารถจากภายนอก และข้อมูลในเครื่องไม่ได้ซิงก์ไปยังอุปกรณ์อื่นโดยอัตโนมัติ',
      href: '#/dashboard'
    },
    {
      id: 'quiz', requestedLabelEn: 'Quiz', requestedLabelTh: 'แบบทดสอบ',
      titleEn: 'Knowledge quizzes with explanations', titleTh: 'แบบทดสอบความรู้พร้อมคำอธิบาย',
      descriptionEn: 'Choose a topic and level, answer multiple-choice questions, and read an explanation after checking each answer.',
      descriptionTh: 'เลือกหัวข้อและระดับ ตอบคำถามแบบปรนัย แล้วอ่านคำอธิบายหลังตรวจคำตอบแต่ละข้อ',
      limitationEn: 'Results show performance on the selected practice questions. This is not a placement test or an official language examination.',
      limitationTh: 'ผลแสดงการตอบคำถามฝึกชุดที่เลือก ไม่ใช่แบบทดสอบจัดระดับหรือการสอบภาษาอย่างเป็นทางการ',
      href: '#/quiz'
    },
    {
      id: 'leaderboard', requestedLabelEn: 'Leaderboard', requestedLabelTh: 'กระดานจัดอันดับ',
      titleEn: 'Leaderboard on this device', titleTh: 'กระดานจัดอันดับในอุปกรณ์นี้',
      descriptionEn: 'Compare real saved activity from learner profiles created in this browser. Rankings update from their completed learning activities.',
      descriptionTh: 'เปรียบเทียบกิจกรรมที่บันทึกจริงของโปรไฟล์ผู้เรียนที่สร้างในเบราว์เซอร์นี้ อันดับอัปเดตจากกิจกรรมการเรียนรู้ที่ทำเสร็จ',
      limitationEn: 'These are local profiles, not verified people or an online class ranking. Clearing local data also removes its contribution to the ranking.',
      limitationTh: 'เป็นโปรไฟล์ในเครื่อง ไม่ใช่การยืนยันตัวบุคคลหรืออันดับชั้นเรียนออนไลน์ เมื่อล้างข้อมูลในเครื่อง ข้อมูลส่วนนั้นจะหายจากการจัดอันดับด้วย',
      href: '#/leaderboard'
    },
    {
      id: 'about', requestedLabelEn: 'About', requestedLabelTh: 'เกี่ยวกับเว็บไซต์',
      titleEn: 'About this learning space', titleTh: 'เกี่ยวกับพื้นที่การเรียนรู้นี้',
      descriptionEn: 'Learn what the coach offers, who the learning material is for, and how guided practice differs from optional AI features.',
      descriptionTh: 'รู้จักสิ่งที่เว็บไซต์ช่วยฝึก กลุ่มผู้เรียนที่เหมาะกับเนื้อหา และความแตกต่างระหว่างการฝึกตามแนวทางกับฟีเจอร์ AI แบบเลือกใช้',
      limitationEn: 'Read Help & privacy for microphone, browser storage, and optional AI details before deciding which features to use.',
      limitationTh: 'อ่านหน้าความช่วยเหลือและความเป็นส่วนตัวเกี่ยวกับไมโครโฟน การเก็บข้อมูลในเบราว์เซอร์ และ AI ก่อนเลือกใช้ฟีเจอร์',
      href: '#/about'
    },
    {
      id: 'badges', requestedLabelEn: 'Achievement Badges', requestedLabelTh: 'เหรียญรางวัล',
      titleEn: 'Achievement badges', titleTh: 'เหรียญรางวัลจากการฝึก',
      descriptionEn: 'Earn badges for recorded learning milestones such as completing lessons, practising regularly, and finishing quizzes.',
      descriptionTh: 'รับเหรียญรางวัลเมื่อถึงเป้าหมายที่บันทึกไว้ เช่น เรียนจบบทเรียน ฝึกอย่างสม่ำเสมอ และทำแบบทดสอบเสร็จ',
      limitationEn: 'Badges recognise participation and practice results. They are not certificates, qualifications, or verified proficiency levels.',
      limitationTh: 'เหรียญแสดงการเข้าร่วมและผลการฝึก ไม่ใช่ประกาศนียบัตร คุณวุฒิ หรือระดับความสามารถทางภาษาที่ผ่านการรับรอง',
      href: '#/leaderboard'
    },
    {
      id: 'profiles', requestedLabelEn: 'User Login', requestedLabelTh: 'เข้าสู่ระบบ',
      titleEn: 'Learner profiles on this device', titleTh: 'โปรไฟล์ผู้เรียนในอุปกรณ์นี้',
      descriptionEn: 'Create or choose a local learner profile to keep preferences, notes, drafts, and saved progress separate in this browser.',
      descriptionTh: 'สร้างหรือเลือกโปรไฟล์ผู้เรียนในเครื่อง เพื่อแยกการตั้งค่า บันทึก ฉบับร่าง และความก้าวหน้าที่บันทึกไว้ในเบราว์เซอร์นี้',
      limitationEn: 'Profiles do not verify identity or provide password-protected accounts. Anyone using this browser may switch profiles; there is no online account sync.',
      limitationTh: 'โปรไฟล์ไม่ได้ยืนยันตัวตนและไม่มีบัญชีที่ป้องกันด้วยรหัสผ่าน ผู้ที่ใช้เบราว์เซอร์นี้สามารถสลับโปรไฟล์ได้ และไม่มีการซิงก์บัญชีออนไลน์',
      href: '#/profiles'
    },
    {
      id: 'mobile-saving', requestedLabelEn: 'Mobile saving', requestedLabelTh: 'การบันทึกข้อมูลบนมือถือ',
      titleEn: 'Keep your practice on this device', titleTh: 'เก็บการฝึกไว้ในอุปกรณ์นี้',
      descriptionEn: 'Notes and speaking drafts save automatically in the selected profile. On supported browsers, an offline copy can reopen the core learning content after it has first loaded online.',
      descriptionTh: 'บันทึกการเรียนรู้และฉบับร่างคำตอบฝึกพูดจะบันทึกอัตโนมัติในโปรไฟล์ที่เลือก เบราว์เซอร์ที่รองรับสามารถเปิดเนื้อหาหลักจากสำเนาออฟไลน์ได้หลังโหลดออนไลน์ครั้งแรกแล้ว',
      limitationEn: 'Browser storage is not a guaranteed backup. Private browsing, clearing site data, or changing devices can make saved work unavailable. Export a backup for a separate copy.',
      limitationTh: 'พื้นที่เก็บข้อมูลของเบราว์เซอร์ไม่ใช่ข้อมูลสำรองที่รับประกันได้ การใช้โหมดส่วนตัว การล้างข้อมูลเว็บไซต์ หรือการเปลี่ยนอุปกรณ์อาจทำให้เข้าถึงงานเดิมไม่ได้ ควรส่งออกข้อมูลสำรองไว้อีกชุด',
      href: '#/device'
    }
  ];

  const guideArticles = [
    {
      id: 'save-on-mobile', titleEn: 'How to save on mobile', titleTh: 'วิธีเก็บข้อมูลการฝึกบนมือถือ',
      summaryEn: 'Use one browser and the right learner profile, check that saving works, and keep an exported backup.',
      summaryTh: 'ใช้เบราว์เซอร์เดิมและเลือกโปรไฟล์ให้ถูก ตรวจสอบว่าบันทึกได้ และเก็บข้อมูลสำรองที่ส่งออกไว้',
      steps: [
        {
          titleEn: 'Choose your profile', titleTh: 'เลือกโปรไฟล์ของคุณ',
          textEn: 'Open the deployed site in your usual browser, outside private browsing, and select your learner profile before practising.',
          textTh: 'เปิดเว็บไซต์ที่เผยแพร่แล้วในเบราว์เซอร์ที่ใช้ประจำโดยไม่ใช้โหมดส่วนตัว และเลือกโปรไฟล์ของคุณก่อนเริ่มฝึก'
        },
        {
          titleEn: 'Check the saved state', titleTh: 'ตรวจสอบสถานะการบันทึก',
          textEn: 'Notes and speaking drafts save while you type. Allow the saved status to appear before closing. Finish an activity to add it to your progress; an unfinished draft is not a completed activity.',
          textTh: 'บันทึกการเรียนรู้และฉบับร่างคำตอบฝึกพูดจะบันทึกขณะพิมพ์ รอให้แสดงสถานะว่าบันทึกแล้วก่อนปิด ทำกิจกรรมให้เสร็จเพื่อเพิ่มในประวัติความก้าวหน้า ฉบับร่างที่ยังไม่เสร็จไม่นับเป็นกิจกรรมที่สำเร็จ'
        },
        {
          titleEn: 'Prepare for offline use', titleTh: 'เตรียมใช้งานออฟไลน์',
          textEn: 'Open the mobile saving page while online and check the offline status. If your browser offers installation or Add to Home Screen, you may use it for easier access. Installation is not a separate backup.',
          textTh: 'เปิดหน้าการบันทึกบนมือถือขณะออนไลน์และตรวจสอบสถานะออฟไลน์ หากเบราว์เซอร์มีตัวเลือกติดตั้งหรือเพิ่มไปยังหน้าจอหลัก คุณสามารถใช้เพื่อเข้าเว็บได้สะดวกขึ้น การติดตั้งไม่ใช่การสำรองข้อมูลอีกชุด'
        },
        {
          titleEn: 'Ask the browser to keep local data', titleTh: 'ขอให้เบราว์เซอร์เก็บข้อมูลในเครื่อง',
          textEn: 'If the storage request is available, use it to ask the browser to retain this site’s data. The browser decides whether to grant the request, and you can still lose data if you clear it yourself.',
          textTh: 'หากมีปุ่มขอเก็บข้อมูล ให้ใช้เพื่อขอให้เบราว์เซอร์เก็บข้อมูลเว็บไซต์นี้ไว้ เบราว์เซอร์เป็นผู้ตัดสินใจว่าจะอนุญาตหรือไม่ และข้อมูลยังหายได้หากคุณล้างข้อมูลด้วยตนเอง'
        },
        {
          titleEn: 'Export a separate backup', titleTh: 'ส่งออกข้อมูลสำรองแยกไว้',
          textEn: 'Export your progress regularly and keep the downloaded file somewhere you can find it. Export before changing devices or clearing browser data. Backups can include your display name, notes, and other saved learning data.',
          textTh: 'ส่งออกความก้าวหน้าเป็นระยะและเก็บไฟล์ที่ดาวน์โหลดไว้ในที่ที่หาเจอ ควรส่งออกก่อนเปลี่ยนอุปกรณ์หรือล้างข้อมูลเบราว์เซอร์ ไฟล์สำรองอาจมีชื่อที่แสดง บันทึก และข้อมูลการเรียนรู้ที่บันทึกไว้อื่น ๆ'
        }
      ],
      noteEn: 'Offline access covers the saved core learning content. Browser speech services and optional AI may still need an internet connection. Profiles and progress do not automatically sync between browsers or devices.',
      noteTh: 'การใช้งานออฟไลน์ครอบคลุมเนื้อหาหลักที่เก็บไว้ บริการเสียงของเบราว์เซอร์และ AI แบบเลือกใช้อาจยังต้องเชื่อมต่ออินเทอร์เน็ต โปรไฟล์และความก้าวหน้าไม่ได้ซิงก์ระหว่างเบราว์เซอร์หรืออุปกรณ์โดยอัตโนมัติ'
    },
    {
      id: 'practice-safely', titleEn: 'Practice safely', titleTh: 'ฝึกอย่างปลอดภัยและเข้าใจข้อจำกัด',
      summaryEn: 'Choose the features you are comfortable with and treat automated feedback as a learning aid.',
      summaryTh: 'เลือกฟีเจอร์ที่คุณสะดวกใช้ และใช้ข้อเสนอแนะอัตโนมัติเป็นตัวช่วยในการเรียนรู้',
      steps: [
        {
          titleEn: 'Use everyday practice details', titleTh: 'ใช้ข้อมูลทั่วไปในการฝึก',
          textEn: 'A first name or fictional example is enough for practice. Avoid putting passwords, identity document numbers, payment details, or private workplace information in your answers or notes.',
          textTh: 'ชื่อเล่นหรือข้อมูลสมมติก็เพียงพอสำหรับการฝึก หลีกเลี่ยงการใส่รหัสผ่าน เลขเอกสารประจำตัว ข้อมูลการชำระเงิน หรือข้อมูลลับของที่ทำงานในคำตอบหรือบันทึก'
        },
        {
          titleEn: 'Choose speech or typing', titleTh: 'เลือกพูดหรือพิมพ์',
          textEn: 'The microphone starts only when you choose it. Your browser’s speech service may process audio remotely. You can type instead and review the transcript before requesting feedback.',
          textTh: 'ไมโครโฟนจะเริ่มเมื่อคุณเลือกใช้เท่านั้น บริการรู้จำเสียงของเบราว์เซอร์อาจประมวลผลเสียงผ่านบริการออนไลน์ คุณสามารถพิมพ์แทนและตรวจข้อความที่ถอดจากเสียงก่อนขอข้อเสนอแนะได้'
        },
        {
          titleEn: 'Know what optional AI receives', titleTh: 'เข้าใจข้อมูลที่ AI แบบเลือกใช้ได้รับ',
          textEn: 'When optional AI is configured and enabled, submitted text and relevant learning context are sent to the configured server and its AI provider. Guided practice remains available without that connection.',
          textTh: 'เมื่อมีการตั้งค่าและเปิดใช้ AI ข้อความที่ส่งและบริบทการเรียนรู้ที่เกี่ยวข้องจะถูกส่งไปยังเซิร์ฟเวอร์ที่ตั้งค่าไว้และผู้ให้บริการ AI คุณยังฝึกในโหมดตามแนวทางได้โดยไม่ต้องใช้การเชื่อมต่อนี้'
        },
        {
          titleEn: 'Use feedback as a practice cue', titleTh: 'ใช้ข้อเสนอแนะเป็นแนวทางฝึกต่อ',
          textEn: 'Word matches compare text, and AI suggestions can be wrong. Listen, try again, and ask a teacher about unclear feedback. Neither percentages nor badges prove a language level.',
          textTh: 'ผลการจับคู่คำเป็นการเปรียบเทียบข้อความ และคำแนะนำจาก AI อาจผิดได้ ลองฟัง ฝึกซ้ำ และถามครูหากข้อเสนอแนะไม่ชัดเจน เปอร์เซ็นต์หรือเหรียญรางวัลไม่ได้ยืนยันระดับภาษา'
        },
        {
          titleEn: 'Take care on shared devices', titleTh: 'ระวังเมื่อใช้อุปกรณ์ร่วมกัน',
          textEn: 'Local profiles have no password protection. Other people using the same browser may switch to your profile and view saved learning data. Keep backup files somewhere appropriate for their contents.',
          textTh: 'โปรไฟล์ในเครื่องไม่มีการป้องกันด้วยรหัสผ่าน คนอื่นที่ใช้เบราว์เซอร์เดียวกันอาจสลับเข้ามาดูข้อมูลการเรียนรู้ที่คุณบันทึกไว้ ควรเก็บไฟล์สำรองในที่ที่เหมาะสมกับข้อมูลภายใน'
        }
      ],
      noteEn: 'The maritime material is for English language practice. Follow your organisation’s approved instructions and training for real work.',
      noteTh: 'เนื้อหาทางทะเลใช้เพื่อฝึกภาษาอังกฤษ ในการทำงานจริงให้ปฏิบัติตามคำสั่งและการฝึกอบรมที่องค์กรของคุณรับรอง'
    }
  ];

  window.CoachContent = Object.freeze({ lessons, scenarios, pronunciation, quiz, featureGuide, guideArticles });
})();
