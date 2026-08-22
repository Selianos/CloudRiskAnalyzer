import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, IconButton, Badge } from '@radix-ui/themes';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useDemoTip } from '../../contexts/DemoTipContext';

const FORM_STEPS = [
  { title: 'Welcome to the Demo', body: 'This is a simulated scan setup. No real credentials are needed — all data is pre-filled to show how the platform works.' },
  { title: 'Step 1 — Choose a Provider', body: 'Select your cloud provider. AWS is fully supported. OCI and GCP support is coming soon. The demo will run against AWS.' },
  { title: 'Step 2 — Choose Scan Type', body: 'Security Audit inspects your cloud configurations and IAM policies against the NCA CCC-2:2024 controls framework.' },
  { title: 'Step 3 — Credentials', body: 'In production, you enter your AWS Access Key ID and Secret here. The demo uses example values — click Start Mock Scan to proceed.' },
  { title: 'Start the Scan', body: 'Click Start Mock Scan. You will be redirected to the results workspace where the risk graph loads automatically after a brief simulation.' }
];

const WORKSPACE_NO_NODE_STEPS = [
  { title: 'Results Workspace', body: 'The graph shows all your cloud resources. Nodes with a red border and exclamation mark have security findings. Green nodes are compliant.' },
  { title: 'Understanding Edges', body: 'Red animated edges mean a resource is directly reachable from the Public Internet — a high-risk exposure path. Gray edges are internal connections.' },
  { title: 'Summary Bar', body: 'The top bar shows a count of Critical, High, Medium, and Passed findings. Use it to quickly assess overall risk before diving into details.' },
  { title: 'Inspect a Resource', body: 'Click any node to open the findings panel on the right. It lists every security rule checked, its severity, and remediation steps.' },
  { title: 'NCA CCC-2:2024 Controls', body: 'Each finding is mapped to an NCA CCC-2:2024 control ID. The finding panel shows which control is violated and what the control requires.' },
  { title: 'Rescan', body: 'Click Rescan Workspace in the top-right to re-run the scan simulation. In production, this triggers the scanner worker against your live AWS account.' }
];

const WORKSPACE_NODE_STEPS = [
  { title: 'Resource Selected', body: 'The right panel shows all findings for this resource. FAIL findings mean a security rule was violated. PASS means compliant.' },
  { title: 'Severity Levels', body: 'CRITICAL and HIGH findings require immediate action. MEDIUM should be addressed soon. LOW findings are informational. Focus on CRITICAL first.' },
  { title: 'NCA CCC Control', body: 'Each FAIL finding is linked to the NCA CCC-2:2024 control it violates. The control ID and description appear below each finding in the panel.' },
  { title: 'Remediation Steps', body: 'Scroll down in the findings panel to see the REMEDIATION section for each finding. It lists the exact steps to fix the issue in AWS.' }
];

export default function DemoGuide() {
  const { page, selectedNode } = useDemoTip();
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const isDismissed = localStorage.getItem('demo-guide-dismissed-v2');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [page, selectedNode]);

  let steps = [];
  if (page === 'form') {
    steps = FORM_STEPS;
  } else if (page === 'workspace') {
    if (selectedNode) {
      steps = WORKSPACE_NODE_STEPS;
    } else {
      steps = WORKSPACE_NO_NODE_STEPS;
    }
  }

  if (dismissed) {
    return (
      <Box style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <Button variant="soft" onClick={() => {
          localStorage.removeItem('demo-guide-dismissed-v2');
          setDismissed(false);
          setMinimized(false);
        }}>
          Restart Guide
        </Button>
      </Box>
    );
  }

  if (minimized) {
    return (
      <Box style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <Button onClick={() => setMinimized(false)} style={{ borderRadius: '20px' }}>
          Guide ({currentStepIndex + 1}/{steps.length})
        </Button>
      </Box>
    );
  }

  const step = steps[currentStepIndex];
  if (!step) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      localStorage.setItem('demo-guide-dismissed-v2', 'true');
      setDismissed(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '300px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '10px',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <Flex justify="between" align="center" mb="3">
        <Flex gap="2" align="center">
          <Text weight="bold" size="3">Demo Guide</Text>
          <Badge variant="soft" color="blue">{currentStepIndex + 1}/{steps.length}</Badge>
        </Flex>
        <Flex gap="1">
          <IconButton size="1" variant="ghost" color="gray" onClick={() => setMinimized(true)}>
            <ChevronDown size={14} />
          </IconButton>
          <IconButton size="1" variant="ghost" color="gray" onClick={() => {
             localStorage.setItem('demo-guide-dismissed-v2', 'true');
             setDismissed(true);
          }}>
            <X size={14} />
          </IconButton>
        </Flex>
      </Flex>

      <Box mb="4">
        <Text weight="bold" size="2" style={{ display: 'block', marginBottom: '8px' }}>
          {step.title}
        </Text>
        <Text size="2" color="gray">
          {step.body}
        </Text>
      </Box>

      <Flex justify="between" align="center">
        <Flex gap="1">
          {steps.map((_, i) => (
            <Box
              key={i}
              onClick={() => setCurrentStepIndex(i)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: i === currentStepIndex ? 'var(--blue-9)' : 'var(--gray-5)',
                cursor: 'pointer'
              }}
            />
          ))}
        </Flex>
        <Flex gap="2">
          <Button size="1" variant="soft" onClick={handlePrev} disabled={currentStepIndex === 0}>
            Prev
          </Button>
          <Button size="1" onClick={handleNext}>
            {currentStepIndex === steps.length - 1 ? 'Got it' : 'Next'}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
