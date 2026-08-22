import React, { useState, useEffect } from 'react';
import { Flex, Text, IconButton } from '@radix-ui/themes';
import { Info, X } from 'lucide-react';
import { useDemoTip } from '../../contexts/DemoTipContext';

export default function DemoContextBar() {
  const { page, selectedNode, activeFinding } = useDemoTip();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('demo-context-bar-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('demo-context-bar-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  let message = '';
  if (page === 'form') {
    message = 'This is a mock scan form. Select AWS as your cloud provider, then click Start Mock Scan to see live results.';
  } else if (page === 'workspace') {
    if (!selectedNode) {
      message = 'Scan complete. The graph shows your cloud infrastructure. Red nodes have security findings. Click any node to inspect it.';
    } else if (selectedNode && (!selectedNode.findings || selectedNode.findings.length === 0)) {
      message = 'This resource passed all security checks. No action required.';
    } else if (selectedNode && selectedNode.findings && selectedNode.findings.length > 0) {
      if (activeFinding) {
        message = `Finding ${activeFinding.rule_name} (${activeFinding.severity}): ${activeFinding.description} — Scroll the panel to see the NCA CCC-2:2024 controls and remediation actions.`;
      } else {
        message = `This resource has ${selectedNode.findings.length} finding(s). Review the findings panel on the right — each finding includes the CCC control it violates and remediation steps.`;
      }
    }
  }

  return (
    <Flex
      align="center"
      justify="between"
      style={{
        height: '44px',
        backgroundColor: 'var(--blue-2)',
        borderLeft: '3px solid var(--blue-8)',
        padding: '0 16px',
        width: '100%'
      }}
    >
      <Flex align="center" gap="2">
        <Info size={14} color="var(--blue-11)" />
        <Text size="2" color="blue">
          {message}
        </Text>
      </Flex>
      <IconButton size="1" variant="ghost" color="gray" onClick={handleDismiss}>
        <X size={14} />
      </IconButton>
    </Flex>
  );
}
