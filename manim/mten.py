# -*- coding: utf-8 -*-
from manim import *

FONT = "Microsoft YaHei"


class MakeTen(Scene):
    def construct(self):
        title = Text("凑十法：9 + 5 = 14", font_size=54, color=YELLOW, font=FONT).to_edge(UP)
        self.play(Write(title))
        self.wait(0.6)

        eq = Text("9 + 5 = ？", font_size=54, color=WHITE, font=FONT).shift(UP * 0.6)
        self.play(FadeIn(eq, scale=1.2))
        self.wait(0.6)

        five = Text("5", font_size=54, color=WHITE, font=FONT).next_to(eq, DOWN, buff=0.9)
        arrow = Text("把 5 分开：", font_size=40, color=GRAY_B, font=FONT).next_to(five, DOWN, buff=0.7)
        self.play(Write(five), FadeIn(arrow))
        self.wait(0.5)

        one = Text("1", font_size=54, color=TEAL, font=FONT).move_to(five).shift(LEFT * 0.9)
        four = Text("4", font_size=54, color=ORANGE, font=FONT).move_to(five).shift(RIGHT * 0.9)
        self.play(FadeOut(five), FadeIn(one, shift=LEFT * 0.3), FadeIn(four, shift=RIGHT * 0.3))
        tip = Text("把 5 分成 1 和 4", font_size=40, color=TEAL, font=FONT).next_to(arrow, DOWN, buff=0.2)
        self.play(Transform(arrow, tip))
        self.wait(0.8)

        step2 = Text("9 + 1 = 10", font_size=56, color=GREEN, font=FONT).next_to(arrow, DOWN, buff=0.8)
        self.play(Write(step2))
        self.wait(0.8)

        step3 = Text("10 + 4 = 14", font_size=60, color=ORANGE, font=FONT).next_to(step2, DOWN, buff=0.5)
        self.play(Write(step3))
        self.wait(0.8)

        final = Text("9 + 5 = 14", font_size=60, color=BLUE, font=FONT)
        box = SurroundingRectangle(final, color=BLUE, buff=0.15)
        self.play(FadeOut(box), FadeIn(final, scale=0.8))
        self.play(Create(SurroundingRectangle(final, color=BLUE, buff=0.15)))
        self.wait(1.5)