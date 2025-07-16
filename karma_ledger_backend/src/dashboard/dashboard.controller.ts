import { Controller, Get, Request, Patch, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AuthenticatedRequest } from 'src/util/types';
import { ApiBearerAuth } from '@nestjs/swagger';
import { handleError } from 'src/util/error';
import { HttpException, HttpStatus } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly DashboardService: DashboardService) {}

  @Get('/trigger-suggestions')
  async triggerSuggestions(@Request() req: AuthenticatedRequest) {
    return this.DashboardService.triggerSuggestionProcessing(
      req.user?.user_id ?? '',
    );
  }

  @Get('/suggestions')
  async getSuggestions(@Request() req: AuthenticatedRequest) {
    return this.DashboardService.getSuggestions(req.user?.user_id ?? '');
  }

  @Patch('/suggestions/:id/mark-used')
  async markSuggestionAsUsed(
    @Param('id') suggestionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.DashboardService.markSuggestionAsUsed(
        suggestionId,
        req.user?.user_id ?? '',
      );
    } catch (error) {
      throw new HttpException(handleError(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/karma-scores')
  async getKarmaScores(@Request() req: AuthenticatedRequest) {
    return this.DashboardService.getWeeklyKarmaScores(req.user?.user_id ?? '');
  }

  @Get('/leaderboard')
  async leaderBoardStats() {
    try {
      return this.DashboardService.getWeeklyLeaderboard();
    } catch (error) {
      throw new HttpException(handleError(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/badges')
  async getAllBadges() {
    try {
      return this.DashboardService.getAllBadges();
    } catch (error) {
      throw new HttpException(handleError(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('badges/me')
  async getUserBadges(@Request() req: AuthenticatedRequest) {
    try {
      return this.DashboardService.getUserBadges(req.user?.user_id ?? '');
    } catch (error) {
      throw new HttpException(handleError(error), HttpStatus.BAD_REQUEST);
    }
  }
}
