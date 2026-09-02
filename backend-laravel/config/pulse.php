<?php

return [
    'allowed_events' => [
        'learning.lesson.completed',
        'learning.experience.submitted',
        'learning.project.submitted',
        'learning.assessment.passed',
        'learning.experience.completed',
        'learning.milestone.completed',
        'learning.path.progressed',
        'learning.course.completed',
        'learning.path.completed',
    ],

    'default_timezone' => env('PULSE_DEFAULT_TIMEZONE', 'UTC'),
    'max_processing_attempts' => (int) env('PULSE_MAX_PROCESSING_ATTEMPTS', 5),

    'level_curve' => [
        'max_level' => 100,
        'base_xp' => 100,
        'increment_xp' => 100,
    ],
];
