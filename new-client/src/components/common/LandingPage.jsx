import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Paper,
  Stack,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Code as CodeIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <CodeIcon fontSize="large" color="primary" />,
      title: 'Interactive Coding Environment',
      description: 'Write, run, and test your code in our feature-rich online IDE that supports multiple programming languages.',
      link: '/tests'
    },
    {
      icon: <AssignmentIcon fontSize="large" color="primary" />,
      title: 'Diverse Challenges',
      description: 'Access a wide range of coding problems from easy to hard, covering various algorithms and data structures.',
      link: '/tests'
    },
    {
      icon: <EmojiEventsIcon fontSize="large" color="primary" />,
      title: 'Track Your Progress',
      description: 'Monitor your performance, track your submission history, and see how you improve over time.',
      link: '/submissions'
    },
    {
      icon: <SpeedIcon fontSize="large" color="primary" />,
      title: 'Real-time Feedback',
      description: 'Get instant feedback on your code with detailed test results and performance metrics.',
      link: '/tests'
    },
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: 'Secure Environment',
      description: 'Code in a secure sandbox environment that protects your work and ensures fair evaluation.',
      link: '/register'
    },
    {
      icon: <SchoolIcon fontSize="large" color="primary" />,
      title: 'Learn and Improve',
      description: 'Access solutions and explanations to learn from your mistakes and improve your coding skills.',
      link: '/dashboard'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Software Engineer at Google',
      avatar: 'A',
      content: 'CodeTest helped me prepare for my technical interviews. The platform is intuitive and the challenges are very similar to what I faced in real interviews.'
    },
    {
      name: 'Sarah Chen',
      role: 'Full Stack Developer',
      avatar: 'S',
      content: 'I use CodeTest regularly to keep my coding skills sharp. The variety of challenges and the detailed feedback have significantly improved my problem-solving abilities.'
    },
    {
      name: 'Michael Rodriguez',
      role: 'CS Student',
      avatar: 'M',
      content: 'As a computer science student, CodeTest has been invaluable for practicing concepts I learn in class. The platform makes coding fun and engaging!'
    }
  ];

  const stats = [
    { value: '500+', label: 'Coding Challenges' },
    { value: '10,000+', label: 'Active Users' },
    { value: '5', label: 'Programming Languages' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 16 },
          pb: { xs: 12, md: 20 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                component="h1"
                variant="h2"
                color="inherit"
                fontWeight="bold"
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                Master Your Coding Skills
              </Typography>
              <Typography
                variant="h5"
                color="inherit"
                paragraph
                sx={{
                  opacity: 0.9,
                  mb: 4,
                  maxWidth: '90%',
                  lineHeight: 1.5
                }}
              >
                Practice coding challenges, prepare for technical interviews, and
                showcase your programming skills with our interactive coding
                platform.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontWeight: 600,
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)'
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/tests"
                  sx={{
                    py: 1.5,
                    px: 3,
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Explore Challenges
                </Button>
              </Stack>
            </Grid>
            {!isMobile && (
              <Grid
                item
                md={6}
                sx={{
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '400px',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      width: '80%',
                      height: '80%',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                      zIndex: 1
                    }
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Coding environment"
                    sx={{
                      position: 'absolute',
                      top: '5%',
                      left: '5%',
                      width: '90%',
                      height: '90%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                      zIndex: 2
                    }}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Stats Section */}
        <Container maxWidth="lg" sx={{ mt: { xs: 6, md: 10 }, position: 'relative', zIndex: 2 }}>
          <Paper
            elevation={3}
            sx={{
              py: 4,
              px: 2,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              transform: 'translateY(50%)',
            }}
          >
            <Grid container spacing={2} justifyContent="space-around" alignItems="center">
              {stats.map((stat, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <Grid item sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Divider orientation="vertical" flexItem sx={{ height: 40 }} />
                    </Grid>
                  )}
                  <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" component="div" color="primary.main" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mt: { xs: 10, md: 16 }, mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight="bold"
            gutterBottom
          >
            Why Choose Our Platform?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Our comprehensive coding platform offers everything you need to excel in your programming journey.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                  }
                }}
                elevation={2}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        width: 60,
                        height: 60,
                        mb: 2
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="h5" component="h3" align="center" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    component={RouterLink}
                    to={feature.link}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Learn more
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              Get started with CodeTest in three simple steps
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1472&q=80"
                alt="Coding process"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>1</Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      Create an Account
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Sign up for free and set up your profile to start your coding journey.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>2</Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      Choose a Challenge
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Browse our extensive library of coding challenges and select one that matches your skill level.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>3</Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      Code and Submit
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Write your solution in our online IDE, test it, and submit for evaluation. Get instant feedback and improve.
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{ alignSelf: 'flex-start', mt: 2 }}
                >
                  Start Now
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            What Our Users Say
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Join thousands of satisfied developers who have improved their coding skills with us
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  '&::before': {
                    content: '"\u201C"',
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    fontSize: '4rem',
                    color: 'primary.light',
                    opacity: 0.3,
                    lineHeight: 1
                  }
                }}
              >
                <Typography variant="body1" paragraph sx={{ pt: 3, pb: 2, flexGrow: 1 }}>
                  {testimonial.content}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{testimonial.avatar}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Ready to Improve Your Coding Skills?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join our community of developers and start solving challenges today.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={RouterLink}
                to="/register"
                sx={{
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)'
                }}
              >
                Sign Up for Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/tests"
                sx={{
                  py: 1.5,
                  px: 4,
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Browse Challenges
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
