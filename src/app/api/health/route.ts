import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monitoring } from '@/lib/monitoring';

export async function GET() {
  const startTime = Date.now();

  try {
    const dbCheck = await checkDatabase();
    const healthCheck = monitoring.getHealthCheck();

    const responseTime = Date.now() - startTime;

    const status =
      dbCheck.status === 'healthy' && healthCheck.status === 'healthy'
        ? 'healthy'
        : dbCheck.status === 'unhealthy' || healthCheck.status === 'unhealthy'
          ? 'unhealthy'
          : 'degraded';

    monitoring.info('Health check completed', {
      status,
      responseTime,
      dbStatus: dbCheck.status,
    });

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: healthCheck.uptime,
        responseTime,
        services: {
          database: dbCheck,
          monitoring: {
            status: 'healthy',
            metricsCount: healthCheck.metricsCount,
            logsCount: healthCheck.logsCount,
            errorsCount: healthCheck.errorsCount,
          },
        },
        memory: {
          rss: formatBytes(healthCheck.memoryUsage.rss),
          heapUsed: formatBytes(healthCheck.memoryUsage.heapUsed),
          heapTotal: formatBytes(healthCheck.memoryUsage.heapTotal),
          external: formatBytes(healthCheck.memoryUsage.external),
        },
      },
      {
        status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Status': status,
        },
      }
    );
  } catch (error) {
    monitoring.error('Health check failed', error as Error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - start;

    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
