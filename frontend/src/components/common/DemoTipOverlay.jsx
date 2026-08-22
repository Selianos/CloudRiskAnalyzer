import { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, Badge } from '@radix-ui/themes';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

/**
 * DemoTipOverlay
 *
 * A floating step-by-step guide shown during the demo experience.
 * Props:
 *   - tips: Array<{ title: string, body: string, position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left' }>
 *   - storageKey: string – localStorage key so it doesn't re-appear after the user dismisses it.
 *   - onDismiss?: () => void
 */
export default function DemoTipOverlay({ tips = [], storageKey = 'demo-tips-dismissed', onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);

  // Show after a short delay; respect previous dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
    onDismiss?.();
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey);
    setStep(0);
    setVisible(true);
    setMinimized(false);
  };

  const currentTip = tips[step] ?? null;
  const position = currentTip?.position ?? 'bottom-left';

  const positionStyles = {
    'bottom-left':  { bottom: 24, left: 24 },
    'bottom-right': { bottom: 24, right: 24 },
    'top-right':    { top: 90,   right: 24 },
    'top-left':     { top: 90,   left: 24 },
  };

  if (!visible || tips.length === 0) {
    // Show a small floating "Tips" pill so users can re-open
    return (
      <Box
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
        }}
      >
        <Button
          size="1"
          variant="soft"
          color="amber"
          onClick={handleReset}
          style={{ cursor: 'pointer', gap: 4 }}
        >
          <Lightbulb size={13} />
          Demo Tips
        </Button>
      </Box>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        zIndex: 9999,
        ...positionStyles[position],
      }}
    >
      {/* Minimized pill */}
      {minimized ? (
        <Button
          size="1"
          variant="solid"
          color="amber"
          onClick={() => setMinimized(false)}
          style={{ cursor: 'pointer', gap: 4 }}
        >
          <Lightbulb size={13} />
          Demo Tips ({step + 1}/{tips.length})
        </Button>
      ) : (
        <Box
          style={{
            width: 320,
            backgroundColor: 'white',
            border: '1px solid var(--amber-6)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="between"
            px="3"
            py="2"
            style={{
              backgroundColor: 'var(--amber-3)',
              borderBottom: '1px solid var(--amber-5)',
            }}
          >
            <Flex align="center" gap="2">
              <Lightbulb size={15} color="var(--amber-11)" />
              <Text size="2" weight="bold" style={{ color: 'var(--amber-11)' }}>
                Demo Guide
              </Text>
              <Badge color="amber" variant="soft" size="1">
                {step + 1} / {tips.length}
              </Badge>
            </Flex>
            <Flex gap="1">
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => setMinimized(true)}
                style={{ cursor: 'pointer', padding: '2px 4px' }}
                title="Minimize"
              >
                –
              </Button>
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={handleDismiss}
                style={{ cursor: 'pointer', padding: '2px 4px' }}
                title="Close tips"
              >
                <X size={13} />
              </Button>
            </Flex>
          </Flex>

          {/* Body */}
          <Box px="4" py="3">
            <Text
              as="div"
              size="2"
              weight="bold"
              mb="1"
              style={{ color: 'var(--gray-12)' }}
            >
              {currentTip?.title}
            </Text>
            <Text
              as="div"
              size="2"
              color="gray"
              style={{ lineHeight: 1.6 }}
            >
              {currentTip?.body}
            </Text>
          </Box>

          {/* Progress dots */}
          <Flex justify="center" gap="1" pb="3">
            {tips.map((_, i) => (
              <Box
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 18 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: i === step ? 'var(--amber-9)' : 'var(--amber-4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Flex>

          {/* Navigation */}
          <Flex
            justify="between"
            align="center"
            px="3"
            pb="3"
            gap="2"
          >
            <Button
              size="1"
              variant="soft"
              color="gray"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              style={{ cursor: step === 0 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={13} /> Prev
            </Button>

            {step < tips.length - 1 ? (
              <Button
                size="1"
                variant="solid"
                color="amber"
                onClick={() => setStep((s) => s + 1)}
                style={{ cursor: 'pointer' }}
              >
                Next <ChevronRight size={13} />
              </Button>
            ) : (
              <Button
                size="1"
                variant="solid"
                color="green"
                onClick={handleDismiss}
                style={{ cursor: 'pointer' }}
              >
                Got it ✓
              </Button>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
